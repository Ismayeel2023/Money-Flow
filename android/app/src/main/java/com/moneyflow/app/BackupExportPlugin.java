package com.moneyflow.app;

import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupExport")
public class BackupExportPlugin extends Plugin {
    @PluginMethod
    public void shareFile(PluginCall call) {
        String content = call.getString("content", "");
        String filename = call.getString("filename", "MoneyFlow_Backup.json");
        String mimeType = call.getString("mimeType", "application/json;charset=utf-8");

        if (content == null || content.isEmpty()) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Backup is empty.");
            call.resolve(result);
            return;
        }

        try {
            File cacheDir = getContext().getCacheDir();
            File outFile = new File(cacheDir, filename);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(content.getBytes(StandardCharsets.UTF_8));
            }

            Uri uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    outFile
            );

            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType(mimeType.contains("csv") ? "text/csv" : "application/json");
            share.putExtra(Intent.EXTRA_STREAM, uri);
            share.putExtra(Intent.EXTRA_SUBJECT, filename);
            share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(share, "Save Money Flow backup");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Choose Drive, Files, or WhatsApp to save \"" + filename + "\".");
            call.resolve(result);
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", e.getMessage() != null ? e.getMessage() : "Could not share backup.");
            call.resolve(result);
        }
    }
}
