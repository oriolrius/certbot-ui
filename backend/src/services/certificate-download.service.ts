import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import config from '../config';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const execAsync = promisify(exec);

export type CertificateFormat =
  | 'pem'
  | 'der'
  | 'p7b'
  | 'pkcs12'
  | 'jks'
  | 'crt'
  | 'cer';

export type CertificateComponent =
  | 'cert' // Certificate only
  | 'fullchain' // Certificate + intermediates
  | 'chain' // Intermediates only
  | 'privkey' // Private key
  | 'bundle'; // Certificate + private key

export interface DownloadOptions {
  certName: string;
  format: CertificateFormat;
  component: CertificateComponent;
  password?: string; // Required for PKCS12/JKS formats
}

export class CertificateDownloadService {
  private certsDir: string;

  constructor() {
    // Certificates are stored in configDir/live/
    this.certsDir = path.join(config.certbot.configDir, 'live');
  }

  /**
   * Get the certificate files for a given certificate name
   */
  private async getCertificatePaths(certName: string): Promise<{
    cert: string;
    chain: string;
    fullchain: string;
    privkey: string;
  }> {
    const basePath = path.join(this.certsDir, certName);

    // Verify certificate directory exists
    try {
      await fs.access(basePath);
    } catch (error) {
      throw new AppError(`Certificate '${certName}' not found`, 404, 'CERT_NOT_FOUND');
    }

    return {
      cert: path.join(basePath, 'cert.pem'),
      chain: path.join(basePath, 'chain.pem'),
      fullchain: path.join(basePath, 'fullchain.pem'),
      privkey: path.join(basePath, 'privkey.pem'),
    };
  }

  /**
   * Get the source file based on component type
   */
  private async getSourceFile(
    certName: string,
    component: CertificateComponent
  ): Promise<string> {
    const paths = await this.getCertificatePaths(certName);

    switch (component) {
      case 'cert':
        return paths.cert;
      case 'fullchain':
        return paths.fullchain;
      case 'chain':
        return paths.chain;
      case 'privkey':
        return paths.privkey;
      case 'bundle':
        // For bundle, we'll need to combine cert and privkey
        return paths.fullchain; // Will be handled specially
      default:
        throw new AppError('Invalid certificate component', 400, 'INVALID_COMPONENT');
    }
  }

  /**
   * Get certificate in PEM format (default format from Let's Encrypt)
   */
  async getPEM(certName: string, component: CertificateComponent): Promise<Buffer> {
    const sourceFile = await this.getSourceFile(certName, component);

    if (component === 'bundle') {
      // Combine fullchain and privkey for bundle
      const paths = await this.getCertificatePaths(certName);
      const [certContent, keyContent] = await Promise.all([
        fs.readFile(paths.fullchain, 'utf-8'),
        fs.readFile(paths.privkey, 'utf-8'),
      ]);
      return Buffer.from(`${certContent}\n${keyContent}`);
    }

    return await fs.readFile(sourceFile);
  }

  /**
   * Convert PEM to DER format (binary format, often used with Java)
   */
  async getDER(certName: string, component: CertificateComponent): Promise<Buffer> {
    if (component === 'bundle') {
      throw new AppError('DER format does not support bundle', 400, 'INVALID_FORMAT_COMBINATION');
    }

    const sourceFile = await this.getSourceFile(certName, component);
    const tempOutput = `/tmp/${certName}-${component}.der`;

    try {
      if (component === 'privkey') {
        // For private keys, use pkcs8 format which supports both RSA and ECDSA
        await execAsync(
          `openssl pkcs8 -topk8 -nocrypt -inform PEM -outform DER -in "${sourceFile}" -out "${tempOutput}"`
        );
      } else {
        // For certificates, use x509
        await execAsync(
          `openssl x509 -outform der -in "${sourceFile}" -out "${tempOutput}"`
        );
      }

      const derContent = await fs.readFile(tempOutput);
      await fs.unlink(tempOutput); // Clean up

      return derContent;
    } catch (error) {
      logger.error(`Failed to convert to DER: ${error}`);
      throw new AppError('Failed to convert certificate to DER format', 500, 'CONVERSION_ERROR');
    }
  }

  /**
   * Convert to PKCS#7/P7B format (contains cert and chain, no private key)
   */
  async getP7B(certName: string, component: CertificateComponent): Promise<Buffer> {
    if (component === 'privkey') {
      throw new AppError('P7B format does not support private key', 400, 'INVALID_FORMAT_COMBINATION');
    }

    if (component === 'bundle') {
      throw new AppError('P7B format does not support bundle', 400, 'INVALID_FORMAT_COMBINATION');
    }

    const sourceFile = await this.getSourceFile(certName, component);
    const tempOutput = `/tmp/${certName}-${component}.p7b`;

    try {
      await execAsync(
        `openssl crl2pkcs7 -nocrl -certfile "${sourceFile}" -out "${tempOutput}"`
      );

      const p7bContent = await fs.readFile(tempOutput);
      await fs.unlink(tempOutput);

      return p7bContent;
    } catch (error) {
      logger.error(`Failed to convert to P7B: ${error}`);
      throw new AppError('Failed to convert certificate to P7B format', 500, 'CONVERSION_ERROR');
    }
  }

  /**
   * Convert to PKCS#12/PFX format (contains cert, chain, and private key)
   */
  async getPKCS12(
    certName: string,
    component: CertificateComponent,
    password: string
  ): Promise<Buffer> {
    if (component === 'chain') {
      throw new AppError('PKCS12 format requires certificate and private key', 400, 'INVALID_FORMAT_COMBINATION');
    }

    const paths = await this.getCertificatePaths(certName);
    const tempOutput = `/tmp/${certName}.p12`;

    try {
      let command: string;

      if (component === 'cert') {
        // Certificate only (no chain)
        command = `openssl pkcs12 -export -out "${tempOutput}" -inkey "${paths.privkey}" -in "${paths.cert}" -password pass:"${password}"`;
      } else {
        // Fullchain or bundle (both include the full chain)
        command = `openssl pkcs12 -export -out "${tempOutput}" -inkey "${paths.privkey}" -in "${paths.fullchain}" -password pass:"${password}"`;
      }

      await execAsync(command);

      const pkcs12Content = await fs.readFile(tempOutput);
      await fs.unlink(tempOutput);

      return pkcs12Content;
    } catch (error) {
      logger.error(`Failed to convert to PKCS12: ${error}`);
      throw new AppError('Failed to convert certificate to PKCS12 format', 500, 'CONVERSION_ERROR');
    }
  }

  /**
   * Convert to Java KeyStore (JKS) format
   */
  async getJKS(
    certName: string,
    component: CertificateComponent,
    password: string
  ): Promise<Buffer> {
    if (component === 'chain' || component === 'privkey') {
      throw new AppError('JKS format requires certificate and private key', 400, 'INVALID_FORMAT_COMBINATION');
    }

    const tempP12 = `/tmp/${certName}.p12`;
    const tempJKS = `/tmp/${certName}.jks`;

    try {
      // First create PKCS12
      const pkcs12Content = await this.getPKCS12(certName, component, password);
      await fs.writeFile(tempP12, pkcs12Content);

      // Convert PKCS12 to JKS using keytool
      await execAsync(
        `keytool -importkeystore -srckeystore "${tempP12}" -srcstoretype PKCS12 -srcstorepass "${password}" -destkeystore "${tempJKS}" -deststoretype JKS -deststorepass "${password}" -noprompt`
      );

      const jksContent = await fs.readFile(tempJKS);

      // Clean up
      await fs.unlink(tempP12);
      await fs.unlink(tempJKS);

      return jksContent;
    } catch (error) {
      logger.error(`Failed to convert to JKS: ${error}`);
      throw new AppError(
        'Failed to convert certificate to JKS format. Make sure keytool is installed.',
        500,
        'CONVERSION_ERROR'
      );
    }
  }

  /**
   * Get certificate in CRT format (same as PEM but with .crt extension)
   */
  async getCRT(certName: string, component: CertificateComponent): Promise<Buffer> {
    return this.getPEM(certName, component);
  }

  /**
   * Get certificate in CER format (can be PEM or DER, we'll use DER for Windows compatibility)
   */
  async getCER(certName: string, component: CertificateComponent): Promise<Buffer> {
    return this.getDER(certName, component);
  }

  /**
   * Main method to get certificate in any format
   */
  async getCertificate(options: DownloadOptions): Promise<Buffer> {
    const { certName, format, component, password } = options;

    // Validate password for formats that require it
    if ((format === 'pkcs12' || format === 'jks') && !password) {
      throw new AppError(
        `Password is required for ${format.toUpperCase()} format`,
        400,
        'PASSWORD_REQUIRED'
      );
    }

    switch (format) {
      case 'pem':
        return this.getPEM(certName, component);
      case 'der':
        return this.getDER(certName, component);
      case 'p7b':
        return this.getP7B(certName, component);
      case 'pkcs12':
        return this.getPKCS12(certName, component, password!);
      case 'jks':
        return this.getJKS(certName, component, password!);
      case 'crt':
        return this.getCRT(certName, component);
      case 'cer':
        return this.getCER(certName, component);
      default:
        throw new AppError('Invalid certificate format', 400, 'INVALID_FORMAT');
    }
  }

  /**
   * Get the appropriate filename for download
   */
  getFilename(certName: string, format: CertificateFormat, component: CertificateComponent): string {
    // Keep dots, hyphens, and alphanumeric characters - only replace other special chars
    const sanitizedName = certName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Remove any trailing underscores that might have been added
    const cleanName = sanitizedName.replace(/_+$/, '');
    const filename = `${cleanName}-${component}.${format}`;
    
    logger.info(`getFilename() called with: certName="${certName}", format="${format}", component="${component}"`);
    logger.info(`Generated filename: "${filename}"`);
    logger.info(`Filename length: ${filename.length}, last char code: ${filename.charCodeAt(filename.length - 1)}`);
    
    return filename;
  }

  /**
   * Get the appropriate MIME type for the format
   */
  getMimeType(format: CertificateFormat): string {
    const mimeTypes: Record<CertificateFormat, string> = {
      pem: 'application/x-pem-file',
      der: 'application/pkix-cert',
      p7b: 'application/x-pkcs7-certificates',
      pkcs12: 'application/x-pkcs12',
      jks: 'application/octet-stream',
      crt: 'application/pkix-cert',  // Use standard MIME type to prevent browser filename sanitization
      cer: 'application/pkix-cert',
    };

    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Get Let's Encrypt root and intermediate certificates
   */
  async getRootCertificates(): Promise<{
    isrgRootX1: Buffer;
    isrgRootX2: Buffer;
  }> {
    // Let's Encrypt root certificates (these are publicly available)
    const isrgRootX1 = Buffer.from(`-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`);

    const isrgRootX2 = Buffer.from(`-----BEGIN CERTIFICATE-----
MIICGzCCAaGgAwIBAgIQQdKd0XLq7qeAwSxs6S+HUjAKBggqhkjOPQQDAzBPMQsw
CQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2gg
R3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBYMjAeFw0yMDA5MDQwMDAwMDBaFw00
MDA5MTcxNjAwMDBaME8xCzAJBgNVBAYTAlVTMSkwJwYDVQQKEyBJbnRlcm5ldCBT
ZWN1cml0eSBSZXNlYXJjaCBHcm91cDEVMBMGA1UEAxMMSVNSRyBSb290IFgyMHYw
EAYHKoZIzj0CAQYFK4EEACIDYgAEzZvVn4CDCuwJSvMWSj5cz3es3mcFDR0HttwW
+1qLFNvicWDEukWVEYmO6gbf9yoWHKS5xcUy4APgHoIYOIvXRdgKam7mAHf7AlF9
ItgKbppbd9/w+kHsOdx1ymgHDB/qo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0T
AQH/BAUwAwEB/zAdBgNVHQ4EFgQUfEKWrt5LSDv6kviejM9ti6lyN5UwCgYIKoZI
zj0EAwMDaAAwZQIwe3lORlCEwkSHRhtFcP9Ymd70/aTSVaYgLXTWNLxBo1BfASdW
tL4ndQavEi51mI38AjEAi/V3bNTIZargCyzuFJ0nN6T5U6VR5CmD1/iQMVtCnwr1
/q4AaOeMSQ+2b1tbFfLn
-----END CERTIFICATE-----`);

    return {
      isrgRootX1,
      isrgRootX2,
    };
  }
}

export default new CertificateDownloadService();
