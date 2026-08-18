package com.dietai.app

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_RESULT_CODE = 1
    
    // Default server addresses
    private var serverIp = "10.215.125.213" // Your PC's Wi-Fi IP
    private var serverPort = "3000"
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        setupWebView()

        // Detect if running on emulator (uses 10.0.2.2) or real device (uses PC's network IP)
        val isEmulator = (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk_gphone")
                || Build.PRODUCT.contains("google_sdk")

        val targetUrl = if (isEmulator) {
            "http://10.0.2.2:$serverPort"
        } else {
            "http://$serverIp:$serverPort"
        }

        webView.loadUrl(targetUrl)
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.javaScriptCanOpenWindowsAutomatically = true

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                view?.loadUrl(request?.url.toString())
                return true
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Only show connection error for the main page load
                if (request?.isForMainFrame == true) {
                    showIpConfigDialog()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            // Handles `<input type="file" />` clicks (Camera/File uploads) inside WebView
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "image/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE)
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    Toast.makeText(this@MainActivity, "Cannot open file chooser", Toast.LENGTH_LONG).show()
                    return false
                }
                return true
            }
        }
    }

    // Dialog allowing user to enter their PC's IP address dynamically if connection fails
    private fun showIpConfigDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Server Connection Failed")
        builder.setMessage("Could not connect to Next.js server at $serverIp:$serverPort.\n\nPlease enter your PC's IP address:")

        val input = EditText(this)
        input.inputType = InputType.TYPE_CLASS_TEXT
        input.setText(serverIp)
        builder.setView(input)

        builder.setPositiveButton("Connect") { dialog, _ ->
            val enteredIp = input.text.toString().trim()
            if (enteredIp.isNotEmpty()) {
                serverIp = enteredIp
                val newUrl = "http://$serverIp:$serverPort"
                Toast.makeText(this, "Connecting to $newUrl...", Toast.LENGTH_SHORT).show()
                webView.loadUrl(newUrl)
            }
            dialog.dismiss()
        }
        
        builder.setNegativeButton("Retry") { dialog, _ ->
            webView.reload()
            dialog.dismiss()
        }

        builder.setCancelable(false)
        builder.show()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback == null) return
            val results = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
