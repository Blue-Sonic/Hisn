package com.muslim.protection.hisn;

import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioPlugin.class);
        super.onCreate(savedInstanceState);
        
        // Force the display to run at its maximum refresh rate (e.g., 120Hz on Samsung)
        Window window = getWindow();
        WindowManager.LayoutParams layoutParams = window.getAttributes();
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            try {
                android.view.Display.Mode[] modes = getDisplay().getSupportedModes();
                float maxRefresh = 60.0f;
                for (android.view.Display.Mode mode : modes) {
                    if (mode.getRefreshRate() > maxRefresh) {
                        maxRefresh = mode.getRefreshRate();
                    }
                }
                layoutParams.preferredRefreshRate = maxRefresh;
            } catch (Exception e) {
                layoutParams.preferredRefreshRate = 120.0f;
            }
        } else {
            layoutParams.preferredRefreshRate = 120.0f;
        }
        window.setAttributes(layoutParams);
        
        // Disable Android WebView force-dark mode to ensure strict Light Mode
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            try {
                window.getDecorView().post(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().getSettings().setForceDark(WebSettings.FORCE_DARK_OFF);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onBackPressed() {
        // Minimize the app to the background instead of closing/destroying it
        moveTaskToBack(true);
    }

    @Override
    public void onPause() {
        super.onPause();
        // Force WebView to stay resumed even when activity is paused to keep audio playing
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onResume();
        }
    }
}
