package com.habitcompass.app;

import android.util.Log;
import androidx.appcompat.app.AppCompatDelegate;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

@CapacitorPlugin(name = "DisplayPreferences")
public class DisplayPreferencesPlugin extends Plugin {
    private static final String TAG = "DisplayPreferences";

    @PluginMethod
    public void applyDisplayPreferences(PluginCall call) {
        String theme = call.getString("theme");
        String revenueCatLocale = call.getString("revenueCatLocale");

        try {
            AppCompatDelegate.setDefaultNightMode(getNightMode(theme));
        } catch (IllegalArgumentException exception) {
            call.reject("Unsupported display theme preference.", exception);
            return;
        }

        JSObject result = new JSObject();
        result.put("themeApplied", true);

        try {
            result.put("revenueCatLocaleApplied", applyRevenueCatLocale(revenueCatLocale));
        } catch (ClassNotFoundException | NoSuchMethodException exception) {
            Log.w(TAG, "RevenueCat locale override is unavailable.", exception);
            call.reject("RevenueCat locale override is unavailable.", exception);
            return;
        } catch (InvocationTargetException exception) {
            Log.w(
                TAG,
                "RevenueCat locale override could not be applied yet.",
                exception.getCause()
            );
            result.put("revenueCatLocaleApplied", false);
        } catch (IllegalAccessException exception) {
            Log.w(TAG, "RevenueCat locale override could not be accessed.", exception);
            call.reject("RevenueCat locale override could not be accessed.", exception);
            return;
        }

        call.resolve(result);
    }

    private int getNightMode(String theme) {
        if (theme == null || theme.equals("system")) {
            return AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM;
        }

        if (theme.equals("light")) {
            return AppCompatDelegate.MODE_NIGHT_NO;
        }

        if (theme.equals("dark")) {
            return AppCompatDelegate.MODE_NIGHT_YES;
        }

        throw new IllegalArgumentException("Unsupported theme: " + theme);
    }

    private boolean applyRevenueCatLocale(String locale)
        throws
            ClassNotFoundException,
            NoSuchMethodException,
            InvocationTargetException,
            IllegalAccessException {
        Class<?> purchasesClass = Class.forName("com.revenuecat.purchases.Purchases");
        Method getSharedInstance = purchasesClass.getMethod("getSharedInstance");
        Object purchases = getSharedInstance.invoke(null);
        Method overridePreferredUILocale = purchasesClass.getMethod(
            "overridePreferredUILocale",
            String.class
        );
        Object applied = overridePreferredUILocale.invoke(purchases, locale);

        return Boolean.TRUE.equals(applied);
    }
}
