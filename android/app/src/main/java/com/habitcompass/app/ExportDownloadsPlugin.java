package com.habitcompass.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "ExportDownloads")
public class ExportDownloadsPlugin extends Plugin {
    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType");
        String data = call.getString("data");

        if (filename == null || filename.trim().isEmpty() || mimeType == null || data == null) {
            call.reject("Export file data is incomplete.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            Uri uri = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? saveWithMediaStore(filename, mimeType, bytes)
                : saveWithLegacyDownloads(filename, bytes);

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Export file could not be saved.", exception);
        }
    }

    private Uri saveWithMediaStore(String filename, String mimeType, byte[] bytes) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            throw new IllegalStateException("Downloads entry could not be created.");
        }

        try (OutputStream stream = resolver.openOutputStream(uri)) {
            if (stream == null) {
                throw new IllegalStateException("Downloads output stream could not be opened.");
            }

            stream.write(bytes);
        } catch (Exception exception) {
            resolver.delete(uri, null, null);
            throw exception;
        }

        values.clear();
        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, values, null, null);
        return uri;
    }

    private Uri saveWithLegacyDownloads(String filename, byte[] bytes) throws Exception {
        File downloadsDirectory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!downloadsDirectory.exists() && !downloadsDirectory.mkdirs()) {
            throw new IllegalStateException("Downloads directory could not be created.");
        }

        File file = getAvailableFile(downloadsDirectory, filename);
        try (FileOutputStream stream = new FileOutputStream(file)) {
            stream.write(bytes);
        }

        return Uri.fromFile(file);
    }

    private File getAvailableFile(File directory, String filename) {
        File file = new File(directory, filename);
        if (!file.exists()) {
            return file;
        }

        int dotIndex = filename.lastIndexOf('.');
        String baseName = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
        String extension = dotIndex > 0 ? filename.substring(dotIndex) : "";
        int copyIndex = 1;

        do {
            file = new File(directory, baseName + " (" + copyIndex + ")" + extension);
            copyIndex += 1;
        } while (file.exists());

        return file;
    }
}
