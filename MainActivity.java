package com.hocusfocus.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;
import java.io.InputStream;
import java.util.ArrayList;

public class MainActivity extends Activity {
    private static final int MIC_PERMISSION = 4001;
    private static final int NOTIFICATION_PERMISSION = 4002;
    private static final int PHOTO_PICKER = 4003;
    private static final String APP_HOST = "appassets.androidplatform.net";

    private WebView webView;
    private SpeechRecognizer speech;
    private ValueCallback<Uri[]> photoCallback;
    private String pendingLanguage = "en-IN";
    private boolean speechEnded;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(13,14,19));
        getWindow().setNavigationBarColor(Color.rgb(13,14,19));

        ReminderReceiver.ensureChannel(this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(13,14,19));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.addJavascriptInterface(new NativeBridge(), "HFNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (!"https".equals(url.getScheme()) || !APP_HOST.equals(url.getHost())) return null;
                String path = url.getPath();
                if (path == null || !path.startsWith("/assets/")) return null;
                String assetPath = path.substring("/assets/".length());
                if (assetPath.isEmpty()) assetPath = "index.html";
                if (assetPath.contains("..") || assetPath.startsWith("/")) return null;
                try {
                    InputStream is = getAssets().open("www/" + assetPath);
                    String mime = "text/plain";
                    if (assetPath.endsWith(".html")) mime="text/html";
                    else if (assetPath.endsWith(".js")) mime="text/javascript";
                    else if (assetPath.endsWith(".png")) mime="image/png";
                    else if (assetPath.endsWith(".svg")) mime="image/svg+xml";
                    else if (assetPath.endsWith(".css")) mime="text/css";
                    else if (assetPath.endsWith(".webmanifest")) mime="application/manifest+json";
                    return new WebResourceResponse(mime, "UTF-8", is);
                } catch (Exception ignored) { return null; }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("https".equals(u.getScheme()) && APP_HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (photoCallback != null) photoCallback.onReceiveValue(null);
                photoCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.setType("image/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(Intent.createChooser(intent,"Choose a profile photo"), PHOTO_PICKER); }
                catch (Exception e) { photoCallback.onReceiveValue(null); photoCallback=null; }
                return true;
            }
        });
        setContentView(webView);
        webView.loadUrl("https://" + APP_HOST + "/assets/index.html");
    }

    private void js(String javascript) {
        handler.post(() -> { if (webView != null) webView.evaluateJavascript(javascript, null); });
    }
    private void speechEvent(String event, String dataJson) {
        js("window.__hfSpeechEvent && window.__hfSpeechEvent("+JSONObject.quote(event)+","+dataJson+");");
    }
    private void speechError(String reason) {
        speechEvent("error", "{\"error\":"+JSONObject.quote(reason)+"}");
    }
    private void endSpeech() {
        if (speechEnded) return;
        speechEnded=true;
        speechEvent("end", "{}");
        if (speech != null) { speech.destroy(); speech=null; }
    }
    private String speechErrorCode(int error) {
        switch(error) {
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "no-speech";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "not-allowed";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "aborted";
            default: return "unknown";
        }
    }
    private void startSpeechInternal(String lang) {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingLanguage=lang;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},MIC_PERMISSION);
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            speechError("service-not-allowed");speechEvent("end","{}");return;
        }
        if (speech != null) { speech.destroy(); speech=null; }
        speechEnded=false;
        try {
            speech=SpeechRecognizer.createSpeechRecognizer(this);
            speech.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle b) { speechEvent("start","{}"); }
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rms) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onError(int error) { speechError(speechErrorCode(error));endSpeech(); }
                @Override public void onResults(Bundle results) { dispatchResults(results,true);endSpeech(); }
                @Override public void onPartialResults(Bundle results) { dispatchResults(results,false); }
                @Override public void onEvent(int event,Bundle extras) {}
            });
            Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,lang);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
            speech.startListening(intent);
        } catch(Exception e) {speechError("service-not-allowed");endSpeech();}
    }
    private void dispatchResults(Bundle b,boolean isFinal) {
        if (b==null) return;
        ArrayList<String> lines=b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if(lines==null || lines.isEmpty())return;
        speechEvent("result","{\"text\":"+JSONObject.quote(lines.get(0))+",\"final\":"+isFinal+"}");
    }
    private void askNotificationPermission() {
        if(Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED) {
            notificationResult(true);return;
        }
        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION);
    }
    private void notificationResult(boolean allowed) {
        js("window.__hfNotifyPermission && window.__hfNotifyPermission("+JSONObject.quote(allowed?"granted":"denied")+");");
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(code,permissions,results);
        boolean granted=results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED;
        if(code==MIC_PERMISSION){
            if(granted)startSpeechInternal(pendingLanguage);
            else {speechError("not-allowed");speechEvent("end","{}");}
        }else if(code==NOTIFICATION_PERMISSION){notificationResult(granted);}
    }
    @Override protected void onActivityResult(int code,int resultCode,Intent data) {
        super.onActivityResult(code,resultCode,data);
        if(code==PHOTO_PICKER && photoCallback!=null){
            Uri uri=resultCode==RESULT_OK && data!=null?data.getData():null;
            photoCallback.onReceiveValue(uri==null?null:new Uri[]{uri});
            photoCallback=null;
        }
    }
    @Override public void onBackPressed() {
        if (webView == null) { super.onBackPressed(); return; }
        webView.evaluateJavascript("Boolean(document.querySelector('#c.show,#s.show'))", result -> {
            if ("true".equals(result)) webView.evaluateJavascript("history.back()", null);
            else finish();
        });
    }
    @Override protected void onDestroy(){
        if(speech!=null) {speech.destroy();speech=null;}
        if(webView!=null){webView.destroy();webView=null;}
        super.onDestroy();
    }

    public class NativeBridge {
        @JavascriptInterface public void startSpeech(String lang){
            handler.post(()->startSpeechInternal(lang==null?"en-IN":lang));
        }
        @JavascriptInterface public void stopSpeech(){
            handler.post(()->{ if(speech!=null) speech.stopListening(); else speechEvent("end","{}"); });
        }
        @JavascriptInterface public void abortSpeech(){
            handler.post(()->{ if(speech!=null){speech.cancel();endSpeech();} });
        }
        @JavascriptInterface public void requestNotificationPermission(){ handler.post(()->askNotificationPermission()); }
        @JavascriptInterface public void syncReminders(String json){
            handler.post(()->ReminderScheduler.sync(MainActivity.this,json));
        }
        @JavascriptInterface public void notifyNow(String title,String message){
            handler.post(()->ReminderReceiver.show(MainActivity.this,title,message,(int)System.currentTimeMillis()));
        }
    }
}
