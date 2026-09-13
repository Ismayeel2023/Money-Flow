package com.moneyflow.installer;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import java.io.InputStream;
import java.io.OutputStream;

public class InstallActivity extends AppCompatActivity {
    private static final String ACTION_INSTALL_COMPLETE = "com.moneyflow.installer.INSTALL_COMPLETE";
    private static final String ASSET_APK = "moneyflow.apk";

    private TextView statusText;

    private final BroadcastReceiver installReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent confirm = Build.VERSION.SDK_INT >= 33
                        ? intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent.class)
                        : intent.getParcelableExtra(Intent.EXTRA_INTENT);
                if (confirm != null) {
                    startActivity(confirm);
                }
                return;
            }
            if (status == PackageInstaller.STATUS_SUCCESS) {
                statusText.setText("Money Flow is installed. Open it, then allow Notification access for SMS auto-detect.");
                Intent launch = getPackageManager().getLaunchIntentForPackage("com.moneyflow.app");
                if (launch != null) {
                    startActivity(launch);
                }
                return;
            }
            String message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            statusText.setText(message == null ? "Install failed. Try again." : message);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_install);
        statusText = findViewById(R.id.status_text);
        Button installButton = findViewById(R.id.install_button);
        installButton.setOnClickListener(v -> startInstall());

        IntentFilter filter = new IntentFilter(ACTION_INSTALL_COMPLETE);
        ContextCompat.registerReceiver(this, installReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(installReceiver);
        super.onDestroy();
    }

    private void startInstall() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !getPackageManager().canRequestPackageInstalls()) {
            statusText.setText("Allow this installer to install apps, then tap the button again.");
            Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            settings.setData(Uri.parse("package:" + getPackageName()));
            startActivity(settings);
            return;
        }

        try {
            getAssets().open(ASSET_APK).close();
        } catch (Exception e) {
            statusText.setText("Installer is missing the Money Flow APK. Download the GitHub Actions installer build.");
            return;
        }

        statusText.setText("Preparing Money Flow…");
        try {
            PackageInstaller installer = getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params =
                    new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            params.setAppPackageName("com.moneyflow.app");
            if (Build.VERSION.SDK_INT >= 34) {
                params.setPackageSource(PackageInstaller.PACKAGE_SOURCE_STORE);
            }
            int sessionId = installer.createSession(params);
            try (PackageInstaller.Session session = installer.openSession(sessionId);
                 InputStream in = getAssets().open(ASSET_APK);
                 OutputStream out = session.openWrite("moneyflow.apk", 0, -1)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
                session.fsync(out);
                Intent callback = new Intent(ACTION_INSTALL_COMPLETE);
                callback.setPackage(getPackageName());
                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    flags |= PendingIntent.FLAG_MUTABLE;
                }
                PendingIntent pendingIntent = PendingIntent.getBroadcast(this, sessionId, callback, flags);
                session.commit(pendingIntent.getIntentSender());
            }
            statusText.setText("Confirm the Android install prompt for Money Flow.");
        } catch (Exception e) {
            statusText.setText("Could not start install: " + e.getMessage());
        }
    }
}
