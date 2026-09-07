/**
 * Biometric Authentication Service
 * Integrates Web Authentication API (WebAuthn / PublicKeyCredential)
 * for Android Fingerprint / Face Unlock, iOS Face ID / Touch ID, and Windows Hello.
 */

export interface BiometricCapability {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  authenticatorType: 'fingerprint' | 'face' | 'biometric' | 'screen_lock';
  platformLabel: string;
  platformIcon: string;
  isEnrolled: boolean;
  enrolledDate?: string;
}

export interface AuthResult {
  success: boolean;
  method: 'biometric' | 'pin';
  error?: string;
}

class BiometricServiceImpl {
  private credentialIdKey = 'moneyflow_webauthn_cred_id';
  private credentialMetaKey = 'moneyflow_webauthn_cred_meta';

  /**
   * Determine device-specific biometric branding (Face ID, Touch ID, Android Fingerprint, Windows Hello).
   */
  getDeviceBiometricInfo(): { type: 'fingerprint' | 'face' | 'biometric' | 'screen_lock'; label: string; icon: string } {
    if (typeof window === 'undefined') {
      return { type: 'fingerprint', label: 'Biometrics', icon: 'fingerprint' };
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';

    const isApple = /iphone|ipad|ipod|macintosh|mac os/.test(ua) || /iphone|ipad|ipod|mac/.test(platform);
    const isAndroid = /android/.test(ua) || /android/.test(platform);
    const isWindows = /windows/.test(ua) || /win/.test(platform);

    if (isApple) {
      // iPhone X and newer or Mac with Touch ID / Face ID
      const hasTouchOrFace = /iphone|ipad/.test(ua) ? 'Face ID / Touch ID' : 'Touch ID';
      return {
        type: /iphone/.test(ua) ? 'face' : 'fingerprint',
        label: hasTouchOrFace,
        icon: /iphone/.test(ua) ? 'face' : 'fingerprint',
      };
    }

    if (isAndroid) {
      return {
        type: 'fingerprint',
        label: 'Fingerprint / Face Unlock',
        icon: 'fingerprint',
      };
    }

    if (isWindows) {
      return {
        type: 'biometric',
        label: 'Windows Hello (Fingerprint / PIN)',
        icon: 'fingerprint',
      };
    }

    return {
      type: 'biometric',
      label: 'Device Biometrics',
      icon: 'fingerprint',
    };
  }

  /**
   * Check whether the current device supports hardware biometric authentication.
   */
  async checkBiometricCapability(): Promise<BiometricCapability> {
    const device = this.getDeviceBiometricInfo();
    const enrolled = this.isBiometricEnrolled();
    const enrolledDate = this.getEnrolledDate();

    if (typeof window === 'undefined') {
      return {
        isSupported: false,
        hasPlatformAuthenticator: false,
        authenticatorType: device.type,
        platformLabel: device.label,
        platformIcon: device.icon,
        isEnrolled: false,
      };
    }

    const isSupported = Boolean(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );

    if (!isSupported) {
      return {
        isSupported: false,
        hasPlatformAuthenticator: false,
        authenticatorType: device.type,
        platformLabel: device.label,
        platformIcon: device.icon,
        isEnrolled: enrolled,
        enrolledDate,
      };
    }

    try {
      const hasPlatform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        isSupported: true,
        hasPlatformAuthenticator: hasPlatform,
        authenticatorType: device.type,
        platformLabel: device.label,
        platformIcon: device.icon,
        isEnrolled: enrolled,
        enrolledDate,
      };
    } catch (e) {
      console.warn('Biometric platform check error:', e);
      return {
        isSupported: true,
        hasPlatformAuthenticator: false,
        authenticatorType: device.type,
        platformLabel: device.label,
        platformIcon: device.icon,
        isEnrolled: enrolled,
        enrolledDate,
      };
    }
  }

  /**
   * Check if a biometric credential has been registered locally.
   */
  isBiometricEnrolled(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(this.credentialIdKey));
  }

  /**
   * Get timestamp of when biometric was enrolled.
   */
  getEnrolledDate(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const meta = localStorage.getItem(this.credentialMetaKey);
    if (!meta) return undefined;
    try {
      const parsed = JSON.parse(meta);
      return parsed.enrolledDate;
    } catch {
      return undefined;
    }
  }

  /**
   * Explicitly enroll / register device biometric hardware (Fingerprint, Face ID, or Windows Hello).
   */
  async registerBiometricCredential(userName: string = 'Vault Owner'): Promise<AuthResult> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return {
        success: false,
        method: 'biometric',
        error: 'WebAuthn biometric hardware is not available on this browser or platform.',
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Money Flow Vault',
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
            userVerification: 'required',
            requireResidentKey: false,
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (credential && credential.rawId) {
        const rawIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(this.credentialIdKey, rawIdBase64);
        localStorage.setItem(
          this.credentialMetaKey,
          JSON.stringify({
            enrolledDate: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: this.getDeviceBiometricInfo().label,
          })
        );

        if ('vibrate' in navigator) {
          navigator.vibrate?.([50, 50, 100]);
        }

        return { success: true, method: 'biometric' };
      }

      return {
        success: false,
        method: 'biometric',
        error: 'Biometric enrollment was dismissed or canceled.',
      };
    } catch (err: any) {
      console.info('Biometric enrollment result:', err?.name, err?.message);

      if (err?.name === 'NotAllowedError') {
        return {
          success: false,
          method: 'biometric',
          error: 'Biometric sensor request was canceled or timed out.',
        };
      }

      if (err?.name === 'SecurityError') {
        return {
          success: false,
          method: 'biometric',
          error: 'Biometrics unavailable in current iframe origin. Open in standalone or native app.',
        };
      }

      return {
        success: false,
        method: 'biometric',
        error: err?.message || 'Biometric enrollment failed.',
      };
    }
  }

  /**
   * Remove stored biometric credential.
   */
  removeBiometricCredential(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.credentialIdKey);
    localStorage.removeItem(this.credentialMetaKey);
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
      // 1. Try modern WebAuthn credential retrieval with userVerification
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
          if ('vibrate' in navigator) {
            navigator.vibrate?.(60);
          }
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
        localStorage.setItem(
          this.credentialMetaKey,
          JSON.stringify({
            enrolledDate: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: this.getDeviceBiometricInfo().label,
          })
        );

        if ('vibrate' in navigator) {
          navigator.vibrate?.(60);
        }
        return { success: true, method: 'biometric' };
      }

      return {
        success: false,
        method: 'biometric',
        error: 'Biometric prompt was dismissed or canceled.',
      };
    } catch (err: any) {
      console.info('Native WebAuthn biometric prompt notification:', err?.name, err?.message);

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
