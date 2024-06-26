package com.hts.hable_pos;

import m.client.android.library.core.common.CommonLibHandler;
import m.client.android.library.core.utils.PLog;
import m.client.android.library.core.view.MainActivity;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;

import android.media.AudioManager;
import android.media.SoundPool;

import com.hts.hable_pos.samples.SoundManager;

/**
 * BaseActivity Class
 * 
 * @author 김태욱(<a mailto="tukim@uracle.co.kr">tukim@uracle.co.kr</a>)
 * @version v 1.0.0
 * @since Android 2.1 <br>
 *        <DT><B>Date: </B>
 *        <DD>2013.08.01</DD>
 *        <DT><B>Company: </B>
 *        <DD>Uracle Co., Ltd.</DD>
 * 
 * 모피어스 내에서 제공되는 모든 Web 페이지의 기본이 되는 Activity
 * html 화면은 모두 BaseActivity 상에서 출력된다.
 * 제어를 원하는 이벤트들은 overriding 하여 구현하며, 각각 페이지 별 이벤트는 화면 단위로 분기하여 처리한다.
 * 플랫폼 내부에서 사용하는 클래스로 해당 클래스의 이름은 변경할 수 없다.
 * 
 * Copyright (c) 2001-2011 Uracle Co., Ltd. 
 * 166 Samseong-dong, Gangnam-gu, Seoul, 135-090, Korea All Rights Reserved.
 */

public class BaseActivity extends MainActivity {

	private String mCurrentPhotoPath; // 최근 촬영이미지 경로
	public static final int ACT_REQ_CODE_TAKE_PHOTO = 1000;
	public static final int PERM_REQ_CODE_TAKE_PHOTO = 2000;

	SoundPool soundPool;
	SoundManager soundManager;
	boolean play;
	int playSoundId;

	/**
	 * Webview가 시작 될 때 호출되는 함수
	 */
	@Override
	public void onPageStarted (WebView view, String url, Bitmap favicon) {
		//캡처 허용, 비허용
		getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);

		// sound 허용 // sound play
		view.getSettings().setMediaPlaybackRequiresUserGesture(false);
		build_sound();

		super.onPageStarted(view, url, favicon);
	}

	/**
	 * MES 추가
	 */
	// Todo - OK / NG 사운드
	public void sound_play(final String fileNm){
		new Thread(new Runnable() {
			@Override
			public void run() {
				if(fileNm.equals("OK")){
					soundManager.playSound(0);
					build_sound();
				}else if(fileNm.equals("NG")) {
					soundManager.playSound(1);
					build_sound();
					//soundManager.add_play_sound(1,R.raw.ng);
				}
			}
		}).start();


	}

	public void build_sound(){
		//롤리팝 이상 버전일 경우
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			soundPool = new SoundPool.Builder().build();
		}else{
			//롤리팝 이하 버전일 경우
			//new SoundPool(1번,2번,3번)
			//1번 - 음악 파일 갯수
			//2번 - 스트림 타입
			//3번 - 음질
			soundPool = new SoundPool(5, AudioManager.STREAM_NOTIFICATION,0);
		}
		soundManager = new SoundManager(this,soundPool);
		soundManager.addSound(0,R.raw.ok);
		soundManager.addSound(1,R.raw.ng);
	}
	// Todo - dialog // gravity: 48 Top , center: 17, bottom: 80
	public void Custom_Dialog(String Title, String Contents, int gravity, int wait){
		AlertDialog.Builder builder = new AlertDialog.Builder(this);

		builder.setTitle(Title).setMessage(Contents);

		final AlertDialog alertDialog = builder.create();
		alertDialog.getWindow().setGravity(gravity);

		alertDialog.show();

		new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
			@Override
			public void run() {
				alertDialog.dismiss();
			}
		}, wait);


	}

	// TODO 쉐어드 저장
	public void setPreferences(String table, String key, String value){
		SharedPreferences preferences = getSharedPreferences( table , MODE_PRIVATE);
		SharedPreferences.Editor editor = preferences.edit();
		editor.putString(key, value);
		editor.apply();
	}

	public String getPreferences(String table, String key, String defaultValue){
		SharedPreferences preferences = getSharedPreferences( table , MODE_PRIVATE);
		return preferences.getString(key, defaultValue);
	}


	/**
	 * Webview내 컨텐츠가 로드되고 난 후 호출되는 함수
	 */
	@Override
	public void onPageFinished(WebView view, String url)  {
		super.onPageFinished(view, url);
		view.requestFocus(View.FOCUS_DOWN);
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, final Intent data) {

//		PLog.i("BaseActivity", "onActivityResult(int requestCode, int resultCode, Intent data)");
//		PLog.d("BaseActivity", "requestCode = " + requestCode);
//		PLog.d("BaseActivity", "resultCode = " + resultCode);
//		PLog.d("BaseActivity", "data = " + data);

		// 사진촬영
		if (requestCode == ACT_REQ_CODE_TAKE_PHOTO) {
			// 사진촬영 완료 - 사용자 취소(back key 등으로)가 아닐경우 실행
			if (resultCode == Activity.RESULT_OK) {
				getWebView().loadUrl("javascript:onTakePictureComplete('" + mCurrentPhotoPath + "')");
			} else { // 사용자 취소(back key 등으로)
				getWebView().loadUrl("javascript:onTakePictureCancel()");
			}
		}

		// TODO Auto-generated method stub
		super.onActivityResult(requestCode, resultCode, data);
		if(resultCode == 2583){
			//final String callback = data.getStringExtra("callback");
			runOnUiThread(new Runnable() {

				@Override
				public void run() {
					// TODO Auto-generated method stub
					try {
						JSONObject obj = new JSONObject();
						obj.put("result",  URLEncoder.encode(data.getStringExtra("RESULT"), "utf-8"));
						getWebView().loadUrl("javascript:fnBarcodeCallback(" + obj.toString() + ");");
					} catch (UnsupportedEncodingException | JSONException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}

				}
			});

			//Toast.makeText(this, "RESULT : " +data.getStringExtra("RESULT"), Toast.LENGTH_LONG).show();
		}
	}

	// 앱 버전 가져오기
	public String getVersionInfo(){
		String version = null;
		try {
			PackageInfo i = getApplicationContext().getPackageManager().getPackageInfo(getApplicationContext().getPackageName(), 0);
			version = i.versionName;
		} catch(PackageManager.NameNotFoundException e) { }
		return version;
	}




	// 앱 버전 가져오기
	public String getDeviceInfo(){
		CommonLibHandler commHandle = CommonLibHandler.getInstance();
		String Device = null;
		try {
			Device = commHandle.g_strDeviceModelName;
		} catch(NullPointerException e) {
			PLog.i("getDeviceInfo", e.toString());
		}
		return Device;
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
		switch (requestCode) {
			case PERM_REQ_CODE_TAKE_PHOTO:
				// If request is cancelled, the result arrays are empty.
				if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
					// permission was granted, yay! Do the
					// contacts-related task you need to do.
					callTakePictureActivity();
				} else {
					// permission denied, boo! Disable the
					// functionality that depends on this permission.
				}
				return;
		}
	}

	public void takePicture() {
		if (Build.VERSION.SDK_INT < 23) {
			// direct call camera activity
			callTakePictureActivity();
		} else {
			// check permission process then call camera activity
			checkPermission();
		}
	}


	private boolean isCamearaPermissionGranted() {
		if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
				== PackageManager.PERMISSION_GRANTED
				&& ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
				== PackageManager.PERMISSION_GRANTED) {
			return true;
		}
		return false;
	}

	private void checkPermission() {
		if (isCamearaPermissionGranted()) {
			callTakePictureActivity();
		} else {
			// Should we show an explanation?
			if (ActivityCompat.shouldShowRequestPermissionRationale(this,
					Manifest.permission.CAMERA)) {
				// Show an explanation to the user *asynchronously* -- don't block
				// this thread waiting for the user's response! After the user
				// sees the explanation, try again to request the permission.
			} else {
				// No explanation needed, we can request the permission.
				ActivityCompat.requestPermissions(this,
						new String[]{Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE},
						PERM_REQ_CODE_TAKE_PHOTO);

				// MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
				// app-defined int constant. The callback method gets the
				// result of the request.
			}
		}
	}

	private void callTakePictureActivity() {
		Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		if(takePictureIntent.resolveActivity(getPackageManager()) != null) {
			File photoFile = null;
			try {
				photoFile = createImageFile();
			} catch(IOException e) {
				e.printStackTrace();
			}

			if(photoFile != null) {
				Uri photoUri = FileProvider.getUriForFile(this,
						"com.hts.hable.fileprovider", photoFile);
				takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoUri);
				startActivityForResult(takePictureIntent, ACT_REQ_CODE_TAKE_PHOTO);
			}
		}
	}

	private File createImageFile() throws IOException {
		String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
		String imageFilename = "JPEG_" + timestamp;
		File dir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
		File image = File.createTempFile(imageFilename, ".jpg", dir);

		mCurrentPhotoPath = "file:" + image.getAbsolutePath();

		return image;
	}
	@Override
	public void onStart() {
		super.onStart();
		Log.d("test_Start2","onStart");
	}
	@Override
	public void onResume() {
		super.onResume();
		Log.d("test_Start2","onResume");
	}
	@Override
	public void onPause() {
		super.onPause();
		Log.d("test_Start2","onPause");
	}
	@Override
	public void onStop() {
		super.onStop();
		Log.d("test_Start2","onStop");
	}
	@Override
	public void onDestroy() {
		super.onDestroy();
		Log.d("test_Start2","onDestroy");
	}
}
