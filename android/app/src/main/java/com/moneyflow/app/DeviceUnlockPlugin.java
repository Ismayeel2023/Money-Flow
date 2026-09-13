package com.moneyflow.app;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "DeviceUnlock")
public class DeviceUnlockPlugin extends Plugin {
    @PluginMethod
    public void isAvailable(PluginCall call) {
        BiometricManager manager = BiometricManager.from(getContext());
        int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG
                | BiometricManager.Authenticators.BIOMETRIC_WEAK
                | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        int status = manager.canAuthenticate(authenticators);
        JSObject result = new JSObject();
        result.put("available", status == BiometricManager.BIOMETRIC_SUCCESS);
        call.resolve(result);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        String reason = call.getString("reason", "Unlock Money Flow");
        if (!(getActivity() instanceof FragmentActivity)) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Unlock screen is not ready.");
            call.resolve(result);
            return;
        }

        FragmentActivity activity = (FragmentActivity) getActivity();
        activity.runOnUiThread(() -> {
            Executor executor = ContextCompat.getMainExecutor(activity);
            BiometricPrompt prompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult authResult) {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                }

                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("error", errString.toString());
                    call.resolve(result);
                }
            });

            BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Money Flow")
                    .setSubtitle(reason)
                    .setAllowedAuthenticators(
                            BiometricManager.Authenticators.BIOMETRIC_STRONG
                                    | BiometricManager.Authenticators.BIOMETRIC_WEAK
                                    | BiometricManager.Authenticators.DEVICE_CREDENTIAL
                    )
                    .build();
            prompt.authenticate(info);
        });
    }
}
