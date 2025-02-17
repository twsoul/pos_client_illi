package com.hts.hable_pos;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Bundle;
import android.os.Environment;
import android.support.v4.app.ActivityCompat;
import android.util.Base64;
import android.util.Log;

import java.io.File;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;

import kr.co.earlysoft.plugin.EarlyRootChecker;
import m.client.android.library.core.common.CommonLibHandler;
import m.client.android.library.core.customview.MPWebView;


/**
 * Startup Class
 * 
 * @author 김태욱(<a mailto="tukim@uracle.co.kr">tukim@uracle.co.kr</a>)
 * @version v 1.0.0
 * @since Android 2.1 <br>
 *        <DT><B>Date: </B>
 *        <DD>2013.08.01</DD>
 *        <DT><B>Company: </B>
 *        <DD>Uracle Co., Ltd.</DD>
 * 
 * 앱이 구동 될 시 시작되는 Activity 
 * 해당 Activity는 최초 앱 구동 후 실제 webApplication이 로딩 후(BaseActivity) 
 * 종료 된다. 
 * 
 * Copyright (c) 2011-2013 Uracle Co., Ltd. 
 * 166 Samseong-dong, Gangnam-gu, Seoul, 135-090, Korea All Rights Reserved.
 */

public class Startup extends Activity {

    final int MY_PERMISSIONS_REQUEST_MULTI = 2011;

    ArrayList<String> permissions = new ArrayList<String>();
	
	private String CLASS_TAG = "Startup";
	private CommonLibHandler commLibHandle = CommonLibHandler.getInstance();
	
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        //SSLConnect ssl = new SSLConnect();
        //ssl.postHttps("https://10.135.198.122:8080", 1000, 1000);

        MPWebView.setWebContentsDebuggingEnabled(false);
        //MPWebView.setWebContentsDebuggingEnabled(true);
        boolean test = BuildConfig.DEBUG;
        Log.d("test_Start12345",test ? "true":"false");
        String currentSignature = "";

        try {
            PackageInfo packageInfo = getApplicationContext().getPackageManager().getPackageInfo(getApplicationContext().getPackageName(), PackageManager.GET_SIGNATURES);
            Signature signature = packageInfo.signatures[0];
            byte[] signatureBytes = signature.toByteArray();
            MessageDigest md = MessageDigest.getInstance("SHA");
            md.update(signature.toByteArray());
            currentSignature = Base64.encodeToString(md.digest(), Base64.DEFAULT);
        } catch (PackageManager.NameNotFoundException | NoSuchAlgorithmException e) {
        }

        if(!getString(R.string.mp_signature).equals(currentSignature.trim())) {
            showFinishDialog(getString(R.string.mp_signature_error));
            return;
        }

        EarlyRootChecker erc = new EarlyRootChecker();
        if (erc.isDeviceRooted()) {
            showFinishDialog(getString(R.string.mp_rooting_device_cannot_use));
            return;
        } else {

            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_PHONE_STATE);
            }
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.CALL_PHONE);
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_CONTACTS);
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.RECORD_AUDIO);
            }
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.SEND_SMS);
            }
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.CAMERA);
            }
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.ACCESS_COARSE_LOCATION);
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.ACCESS_FINE_LOCATION);
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_NETWORK_STATE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.ACCESS_NETWORK_STATE);
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_WIFI_STATE) != PackageManager.PERMISSION_GRANTED) {
                permissions.add(android.Manifest.permission.ACCESS_WIFI_STATE);
            }


            if (permissions.size() > 0) {
                String[] reqPermissionArray = new String[permissions.size()];
                reqPermissionArray = permissions.toArray(reqPermissionArray);
                ActivityCompat.requestPermissions(this, reqPermissionArray, MY_PERMISSIONS_REQUEST_MULTI);
            } else {
                ////////////////////////////////////////////////////////////////////////////////
                // - 중요 -
                // 최초 시작 Activity에 아래의 코드를 넣어야 한다.

                commLibHandle.processAppInit(this);
                ////////////////////////////////////////////////////////////////////////////////

            }
        }
    }

    //루팅체크 관련 추가
    public static final String ROOT_PATH = Environment.getExternalStorageDirectory() + "";
    public static final String ROOTING_PATH_1 = "/sbin/su";
    public static final String ROOTING_PATH_2 = "/system/su";
    public static final String ROOTING_PATH_3 = "/system/bin/su";
    public static final String ROOTING_PATH_4 = "/system/sbin/su";
    public static final String ROOTING_PATH_5 = "/system/xbin/su";
    public static final String ROOTING_PATH_6 = "/system/xbin/mu";
    public static final String ROOTING_PATH_7 = "/system/bin/.ext/.su";
    public static final String ROOTING_PATH_8 = "/system/user/su-backup";
    public static final String ROOTING_PATH_9 = "/data/data/com.noshufou.android.su";
    public static final String ROOTING_PATH_10 = "/system/app/SuperUser.apk";
    public static final String ROOTING_PATH_11 = "/system/app/su.apk";
    public static final String ROOTING_PATH_12 = "/system/bin/.ext";
    public static final String ROOTING_PATH_13 = "/system/xbin/.ext";
    public static final String ROOTING_PATH_14 = "/data/local/xbin/su";
    public static final String ROOTING_PATH_15 = "/data/local/bin/su";
    public static final String ROOTING_PATH_16 = "/system/bin/failsafe/su";
    public static final String ROOTING_PATH_17 = "/data/local/su";
    public static final String ROOTING_PATH_18 = "/su/bin/su";

    public static final String[] RootFilesPath = new String[] {
            ROOT_PATH + ROOTING_PATH_1 ,
            ROOT_PATH + ROOTING_PATH_2 ,
            ROOT_PATH + ROOTING_PATH_3 ,
            ROOT_PATH + ROOTING_PATH_4 ,
            ROOT_PATH + ROOTING_PATH_5 ,
            ROOT_PATH + ROOTING_PATH_6 ,
            ROOT_PATH + ROOTING_PATH_7 ,
            ROOT_PATH + ROOTING_PATH_8 ,
            ROOT_PATH + ROOTING_PATH_9 ,
            ROOT_PATH + ROOTING_PATH_10 ,
            ROOT_PATH + ROOTING_PATH_11 ,
            ROOT_PATH + ROOTING_PATH_12 ,
            ROOT_PATH + ROOTING_PATH_13 ,
            ROOT_PATH + ROOTING_PATH_14 ,
            ROOT_PATH + ROOTING_PATH_15 ,
            ROOT_PATH + ROOTING_PATH_16 ,
            ROOT_PATH + ROOTING_PATH_17 ,
            ROOT_PATH + ROOTING_PATH_18
    };

    public boolean exWNCheckRooting_Start()
    {
        boolean isRooting = false;
        try {
            Runtime.getRuntime().exec("su");
            isRooting = true;
        }
        catch (Exception e) {
            isRooting = false;
        }

        if (!isRooting) {
            isRooting = checkRootingFiles(createFiles(RootFilesPath));
        }

        if(isRooting)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    private static File[] createFiles(String[] sfiles)
    {
        File[] rootingFiles = new File[sfiles.length];
        for (int i=0 ; i < sfiles.length; i++) {
            rootingFiles[i] = new File(sfiles[i]);
        }
        return rootingFiles;
    }

    private static boolean checkRootingFiles(File... files)
    {
        boolean isExist = false;
        for (File file : files) {
            if (file != null && file.exists() && file.isFile()) {
                isExist = true;
                break;
            }
            else {
                isExist = false;
            }
        }
        return isExist;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        switch (requestCode) {
            case MY_PERMISSIONS_REQUEST_MULTI: {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    //핸드폰 정보 권한이 획득되면, 이후 로직 처리
                    commLibHandle.processAppInit(this);
                } else {
                    ActivityCompat.requestPermissions(this, permissions, MY_PERMISSIONS_REQUEST_MULTI);
                }
                return;
            }
        }
    }

    private void showFinishDialog(String message) {
        new AlertDialog.Builder(this)
            .setIcon(android.R.drawable.ic_dialog_alert)
            .setTitle(R.string.app_name)
            .setMessage(message)
            .setPositiveButton(android.R.string.yes, new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.cancel();
                    dialog.dismiss();
                    finish();
                }
            }).setCancelable(false)
            .create().show();
    }
    @Override
    public void onStart() {
        super.onStart();
        Log.d("test_Start","onStart");
    }
    @Override
    public void onResume() {
        super.onResume();
        Log.d("test_Start","onResume");
    }
    @Override
    public void onPause() {
        super.onPause();
        Log.d("test_Start","onPause");
    }
    @Override
    public void onStop() {
        super.onStop();
        Log.d("test_Start","onStop");
    }
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d("test_Start","onDestroy");
    }
}
