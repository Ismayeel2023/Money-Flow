/**
 * Biometric Authentication Service
 * Integrates Web Authentication API (WebAuthn / PublicKeyCredential)
 * for Android Fingerprint / Face Unlock, iOS Face ID / Touch ID, and Windows Hello.
 */

export interface BiometricCapability {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  authenticatorType?: 'fingerprint' | 'face' | 'biometric' | 'screen_lock';
}

export interface AuthResult {
  success: boolean;
  method: 'biometric' | 'pin';
  error?: string;
}

class BiometricServiceImpl {
  private credentialIdKey = 'moneyflow_webauthn_cred_id';

  /**
   * Check whether the current device supports hardware biometric authentication.
   */
  async checkBiometricCapability(): Promise<BiometricCapability> {
    if (typeof window === 'undefined') {
      return { isSupported: false, hasPlatformAuthenticator: false };
    }

    const isSupported = Boolean(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );

    if (!isSupported) {
      return { isSupported: false, hasPlatformAuthenticator: false };
    }

    try {
      const hasPlatform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        isSupported: true,
        hasPlatformAuthenticator: hasPlatform,
        authenticatorType: 'biometric',
      };
    } catch (e) {
      console.warn('Biometric platform check error:', e);
      return { isSupported: true, hasPlatformAuthenticator: false };
    }
  }

  /**
   * Prompt the user for biometric authentication (Fingerprint, Face Unlock, or Device Screen Lock).
   */
  async authenticateWithBiometrics(userName: string = 'Account Owner'): Promise<AuthResult> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return {
        success: false,
        method: 'biometric',
        error: 'Biometric hardware is not available on this browser.',
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    try {
      // 1. Try modern WebAuthn credential retrieval or creation with userVerification
      const storedCredId = localStorage.getItem(this.credentialIdKey);

      if (storedCredId) {
        // Authenticate existing credential
        const credIdUint8 = Uint8Array.from(atob(storedCredId), (c) => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [
              {
                id: credIdUint8,
                type: 'public-key',
                transports: ['internal'],
              },
            ],
            userVerification: 'preferred',
            timeout: 60000,
          },
        });

        if (assertion) {
          return { success: true, method: 'biometric' };
        }
      }

      // 2. If no prior credential or assertion not returned, register a lightweight local credential
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Money Flow Secure',
            id: window.location.hostname || 'localhost',
          },
          user: {
            id: userId,
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            requireResidentKey: false,
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (credential && credential.rawId) {
        const rawIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(this.credentialIdKey, rawIdBase64);
        return { success: true, method: 'biometric' };
      }

      return {
        success: false,
        method: 'biometric',
        error: 'Biometric prompt was dismissed or canceled.',
      };
    } catch (err: any) {
      console.info('Native WebAuthn biometric prompt notification:', err?.name, err?.message);

      // Distinguish user cancellation vs hardware/iframe restrictions
      if (err?.name === 'NotAllowedError') {
        return {
          success: false,
          method: 'biometric',
          error: 'Biometric authentication was canceled or not permitted.',
        };
      }

      if (err?.name === 'SecurityError') {
        return {
          success: false,
          method: 'biometric',
          error: 'Biometrics unavailable in current frame origin. Please use 4-digit PIN.',
        };
      }

      return {
        success: false,
        method: 'biometric',
        error: err?.message || 'Biometric authentication failed. Please use PIN.',
      };
    }
  }
}

export const BiometricService = new BiometricServiceImpl();
