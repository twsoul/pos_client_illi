package com.hts.hable_pos.implementation;

import m.client.android.library.core.bridge.InterfaceJavascript;
import m.client.android.library.core.utils.CommonLibUtil;
import m.client.android.library.core.utils.PLog;
import m.client.android.library.core.utils.Utils;
import m.client.android.library.core.view.AbstractActivity;
import com.hts.hable_pos.BLTPrint;
import com.hts.hable_pos.BaseActivity;
import com.hts.hable_pos.HTMLPrint;

import android.app.ProgressDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.ColorDrawable;
import android.os.Environment;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.WebView;

import java.io.File;

/**
 * ExtendWNInterface Class
 * 
 * @author 류경민(<a mailto="kmryu@uracle.co.kr">kmryu@uracle.co.kr</a>)
 * @version v 1.0.0
 * @since Android 2.1 <br>
 *        <DT><B>Date: </B>
 *        <DD>2011.04</DD>
 *        <DT><B>Company: </B>
 *        <DD>Uracle Co., Ltd.</DD>
 * 
 * 사용자 정의 확장 인터페이스 구현
 * 
 * Copyright (c) 2011-2013 Uracle Co., Ltd. 
 * 166 Samseong-dong, Gangnam-gu, Seoul, 135-090, Korea All Rights Reserved.
 */
public class ExtendWNInterface extends InterfaceJavascript {

	/**
	 * 아래 생성자 메서드는 반드시 포함되어야 한다. 
	 * @param callerObject
	 * @param webView
	 */
	public ExtendWNInterface(AbstractActivity callerObject, WebView webView) {
		super(callerObject, webView);
	}
	
	/**
	 * 보안 키보드 데이터 콜백 함수 
	 * @param data 
	 */
	public void wnCBSecurityKeyboard(Intent data) {  
		// callerObject.startActivityForResult(newIntent,libactivities.ACTY_SECU_KEYBOARD);
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// 사용자 정의 네이티브 확장 메서드 구현
	
	//
	// 아래에 네이티브 확장 메서드들을 구현한다.
	// 사용 예
	//
	public String exWNTestReturnString(String receivedString) {
		String newStr = "I received [" + receivedString + "]";
		return newStr;
	}
	
	/**
	 * WebViewClient의 shouldOverrideUrlLoading()을 확장한다.
	 * @param view
	 * @param url
	 * @return 
	 * 		InterfaceJavascript.URL_LOADING_RETURN_STATUS_NONE	확장 구현을하지 않고 처리를 모피어스로 넘긴다.
	 * 		InterfaceJavascript.URL_LOADING_RETURN_STATUS_TRUE	if the host application wants to leave the current WebView and handle the url itself
	 * 		InterfaceJavascript.URL_LOADING_RETURN_STATUS_FALSE	otherwise return false.
	 */
	public int extendShouldOverrideUrlLoading(WebView view, String url) {

		// Custom url schema 사용 예
//		if(url.startsWith("custom:")) {
//		    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
//		    callerObject.startActivity( intent ); 
//    		return InterfaceJavascript.URL_LOADING_RETURN_STATUS_FALSE;
//    	}
		
		return InterfaceJavascript.URL_LOADING_RETURN_STATUS_NONE;
	}
	
	/**
	 * 페이지 로딩이 시작되었을때 호출된다.
	 * @param view
	 * @param url
	 * @param favicon
	 */
	public void onExtendPageStarted (WebView view, String url, Bitmap favicon) {
		//PLog.i("", ">>> 여기는 ExtendWNInterface onPageStarted입니다!!!");
	}
	
	/**
	 * 페이지 로딩이 완료되었을때 호출된다.
	 * @param view
	 * @param url
	 */
	public void onExtendPageFinished(WebView view, String url) {
		//PLog.i("", ">>> 여기는 ExtendWNInterface onPageFinished!!!");
	}
	
	/**
	 * Give the host application a chance to handle the key event synchronously
	 * @param view
	 * @param event
	 * @return True if the host application wants to handle the key event itself, otherwise return false
	 */
	public boolean extendShouldOverrideKeyEvent(WebView view, KeyEvent event) {
		
		return false;
	}
	
	/**
	 * onActivityResult 발생시 호출.
	 */
	public void onExtendActivityResult(Integer requestCode, Integer resultCode, Intent data) {
		PLog.i("", ">>> 여기는 ExtendWNInterface onExtendActivityResult!!!  requestCode => [ " + requestCode + " ], resultCode => [ " + resultCode + " ]");
	}
	
	/*
	public String syncTest(String param1, String param2) {
		return param1 + param2;
	}
	
	public void asyncTest(final String callback) {
		callerObject.runOnUiThread(new Runnable() {
			@Override
			public void run() {
				String format = "javascript:%s('abc', 1, {'a':'b'});";
				String jsString = String.format(format, callback);
				PLog.d("asyncTest", jsString);
    			webView.loadUrl(jsString);
			}
		});
	}
	*/

	public void exShowIndicator(String message) {
		if ( message == null ) {
			message = "";
		}

		if ( progressDialog == null ) {
			//Log.d("exShowIndicator", progressDialog == null ? "null is true" : "null is false");

			String indMsg = message;
			progressDialog = ProgressDialog.show(getCallerObject(), "", indMsg, true, false);
			if (indMsg.trim().equals(""))
				progressDialog.setContentView(Utils.getDynamicID(commHandle.getApplicationContext(), "layout", "addon_net_progressnetworkdialoglayout"));
			progressDialog.getWindow().setBackgroundDrawable(new ColorDrawable(0));

			// 2015.08.21 강형원 수정. background color 삭제
			//progressDialog.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
			progressDialog.show();
		}
	}

	public String exIsLiveIndicator() {
		if ( progressDialog != null ) {
			return "true";
		} else {
			return "false";
		}
	}

	public void exHideIndicator() {
		if (progressDialog != null) {
			progressDialog.dismiss();
			progressDialog = null;
		}
	}

	//루팅체크 관련 추가
	public static final String ROOT_PATH = Environment.getExternalStorageDirectory() + "";
	public static final String ROOTING_PATH_1 = "/system/bin/su";
	public static final String ROOTING_PATH_2 = "/system/xbin/su";
	public static final String ROOTING_PATH_3 = "/system/app/SuperUser.apk";
	public static final String ROOTING_PATH_4 = "/data/data/com.noshufou.android.su";
	public static final String[] RootFilesPath = new String[] {
			ROOT_PATH + ROOTING_PATH_1 ,
			ROOT_PATH + ROOTING_PATH_2 ,
			ROOT_PATH + ROOTING_PATH_3 ,
			ROOT_PATH + ROOTING_PATH_4
	};

	public String exWNCheckRooting()
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
			return "YES";
		}
		else
		{
			return "NO";
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

	public String exWNCheckRooting2()
	{
		if (CommonLibUtil.isRootingCheck())
		{
			return "YES";
		}
		else
		{
			return "NO";
		}
	}

	public void exWNTakePicture() {
		//PLog.i("exWN", "exWNTakePicture()");
		((BaseActivity)callerObject).takePicture();
	}

	public String exVersionCheck() {
		return ((BaseActivity)callerObject).getVersionInfo();
	}

	public void Sound_play(String fileNm) {
		((BaseActivity)callerObject).sound_play(fileNm);
	}
	public void Custom_Dialog(String Title, String Contents, int gravity, int wait) {
		((BaseActivity)callerObject).Custom_Dialog(Title,Contents, gravity, wait);
	}
	public void setPreferences(String table, String key, String value) {
		((BaseActivity)callerObject).setPreferences(table, key, value);
	}
	public String getPreferences(String table, String key, String value) {
		return ((BaseActivity)callerObject).getPreferences(table, key, value);
	}

	public String exDeviceCheck() {
		return ((BaseActivity)callerObject).getDeviceInfo();
	}

	public void exPrintLabel(String PLANT, String PRINT_DATE, String BOX_NO, String PART_NO, String PART_NM, String LOT_NO, String EO_NO, String QTY, String MODIFY_QTY , String DELIVERY_DATE, String SUPPLIER_NO, String INSP_YN, String SUPPLIER, String LOC, String WEIGHT, String TOTAL_WEIGHT, String MEMO, String BARCODE) {
		Intent intent = new Intent(getCallerObject(), BLTPrint.class);
		intent.putExtra("PLANT", PLANT);
		intent.putExtra("PRINT_DATE", PRINT_DATE);
		intent.putExtra("BOX_NO", BOX_NO);
		intent.putExtra("PART_NO", PART_NO);
		intent.putExtra("PART_NM", PART_NM);
		intent.putExtra("LOT_NO", LOT_NO);
		intent.putExtra("EO_NO", EO_NO);
		intent.putExtra("QTY", QTY);
		intent.putExtra("MODIFY_QTY", MODIFY_QTY);
		intent.putExtra("DELIVERY_DATE", DELIVERY_DATE);
		intent.putExtra("SUPPLIER_NO", SUPPLIER_NO);
		intent.putExtra("INSP_YN", INSP_YN);
		intent.putExtra("SUPPLIER", SUPPLIER);
		intent.putExtra("LOC", LOC);
		intent.putExtra("WEIGHT", WEIGHT);
		intent.putExtra("TOTAL_WEIGHT", TOTAL_WEIGHT);
		intent.putExtra("MEMO", MEMO);
		intent.putExtra("BARCODE", BARCODE);

		getCallerObject().startActivity(intent);
	}

	/*
	public void exPrintHtml(String string_Export) {
		Log.wtf("exPrintHtml","log Test");
		Log.wtf("exPrintHtml",string_Export);
		List<Map<String, Object>> param = new ArrayList<Map<String, Object>>();

	}*/


	//
	public void exPrintHtml(String MOVETYPE, String MOVENM, String VENDOR_NM, String MOVENO, String MOVEDESC, String CREATE_NM, String TOTAL, String PART_CD, String PART_QTY, String PART_NM, String BASIC_UNIT, String MOVE_DT) {
		String[] PART_CD_LIST = null;
		String[] PART_QTY_LIST = null;
		String[] PART_NM_LIST = null;
		String[] BASIC_UNIT_LIST = null;

		Log.wtf("exPrintHtml",PART_CD);
		Log.wtf("exPrintHtml",PART_QTY);
		Log.wtf("exPrintHtml",PART_NM);
		Log.wtf("exPrintHtml",BASIC_UNIT);

		PART_CD = PART_CD.replace("[\"","");
		PART_CD = PART_CD.replace("\"]","");
		PART_CD_LIST = PART_CD.split("\",\"");
		PART_QTY = PART_QTY.replace("[\"","");
		PART_QTY = PART_QTY.replace("\"]","");
		PART_QTY_LIST = PART_QTY.split("\",\"");
		PART_NM = PART_NM.replace("[\"","");
		PART_NM = PART_NM.replace("\"]","");
		PART_NM_LIST = PART_NM.split("\",\"");
		BASIC_UNIT = BASIC_UNIT.replace("[\"","");
		BASIC_UNIT = BASIC_UNIT.replace("\"]","");
		BASIC_UNIT_LIST = BASIC_UNIT.split("\",\"");

		for(int i = 0;i < PART_CD_LIST.length;i++){
			Log.wtf("exPrintHtml","PARTCD" + i +" : "+PART_CD_LIST[i]);
		}
		for(int i = 0;i < PART_QTY_LIST.length;i++){
			Log.wtf("exPrintHtml","PART_QTY" + i +" : "+PART_QTY_LIST[i]);
		}
		for(int i = 0;i < PART_NM_LIST.length;i++){
			Log.wtf("exPrintHtml","PART_NM" + i +" : "+PART_NM_LIST[i]);
		}
		for(int i = 0;i < BASIC_UNIT_LIST.length;i++){
			Log.wtf("exPrintHtml","BASIC_UNIT" + i +" : "+BASIC_UNIT_LIST[i]);
		}


		Intent intent = new Intent(getCallerObject(), HTMLPrint.class);
		intent.putExtra("MOVETYPE", MOVETYPE);
		intent.putExtra("MOVENM", MOVENM);
		intent.putExtra("VENDOR_NM", VENDOR_NM);
		intent.putExtra("MOVENO", MOVENO);
		intent.putExtra("MOVEDESC", MOVEDESC);
		intent.putExtra("CREATE_NM", CREATE_NM);
		intent.putExtra("TOTAL", TOTAL);
		intent.putExtra("MOVE_DT", MOVE_DT);
		intent.putExtra("PART_CD",PART_CD_LIST);
		intent.putExtra("PART_QTY",PART_QTY_LIST);
		intent.putExtra("PART_NM",PART_NM_LIST);
		intent.putExtra("BASIC_UNIT",BASIC_UNIT_LIST);
		Log.wtf("HTMLPrint","checkpoint17");
		getCallerObject().startActivity(intent);
		Log.wtf("HTMLPrint","checkpoint18");
	}
}