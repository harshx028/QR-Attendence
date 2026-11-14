package com.durgafoundation.markattendence;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * Lets the web app check / request Android runtime permissions and open the
 * app's system settings page (for permissions the user denied permanently).
 *
 * checkPermissions() and requestPermissions({ permissions: ["camera"] }) are
 * provided by the Capacitor Plugin base class using the aliases below.
 * States: "granted", "denied" (blocked — only Settings can change it),
 * "prompt" or "prompt-with-rationale" (can still ask).
 */
@CapacitorPlugin(
    name = "AppPermissions",
    permissions = {
        @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }),
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }
        ),
    }
)
public class AppPermissionsPlugin extends Plugin {

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", getContext().getPackageName(), null)
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
