package com.moneyflow.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotificationAccessPlugin.class);
        registerPlugin(DeviceUnlockPlugin.class);
        registerPlugin(BackupExportPlugin.class);
        registerPlugin(LocalRemindersPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
