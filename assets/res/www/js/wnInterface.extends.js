/**
 * wninterface.extends.js
 *
 * 네이티브와의 연계 메서드를 아래에 정의한다.
 * 네이티브 메서드의 실행을 위해서 WN2Common 메서드를 이용해 Native의 메서드 명을 파라미터로 넣는다.
 * @returns {*}
 */

/***
 * 인디데이터 show 함수.
 */
function exShowIndicator(msg) {
	WN2Common("exShowIndicator", msg || "");
}


/**
 * 인디게이터 hide 함수.
 **/
function exHideIndicator() {
	return WN2Common("exHideIndicator");
}

/**
 * GPS
 */
function exWNStartGPSInfo(user_id, interval, db_kind){
	return M.execute('exStartGPSInfo', user_id, interval, db_kind);
}

/**
 * GPS
 */
function exWNStopGPSInfo(){
	return M.execute('exStopGPSInfo');
}


/**
 * GPS
 */
function exWNCapture(){
	return M.execute('exCapture');
}

/**
 * Version
 */
function exWNVersionInfo(){
	return M.execute('exVersionCheck');
}
/**
 * Sound
 */
function play_sound(Ok_Ng){
	return M.execute('Sound_play',Ok_Ng);
}
/**
 * custom_dialog
 */
function Custom_Dialog(Title, Contents, gravity, wait){
	return M.execute('Custom_Dialog',Title,Contents,gravity,wait);
}
/**
 * 쉐어드
 */
function setPreferences(table, key, value){
	return M.execute('setPreferences', table, key, value);
}
function getPreferences(table, key, value){
	return M.execute('getPreferences', table, key, value);
}



/**
 * Device
 */
function exWNDeviceInfo(){
	return M.execute('exDeviceCheck');
}

/**
 * PrintLabel
 */
function exWNPrintLabel(PLANT, PRINT_DATE, BOX_NO, PART_NO, PART_NM, LOT_NO, EO_NO, QTY, MODIFY_QTY, DELIVERY_DATE, SUPPLIER_NO, INSP_YN, SUPPLIER, LOC, WEIGHT, TOTAL_WEIGHT, MEMO, BARCODE){
	return M.execute('exPrintLabel', PLANT, PRINT_DATE, BOX_NO, PART_NO, PART_NM, LOT_NO, EO_NO, QTY, MODIFY_QTY, DELIVERY_DATE, SUPPLIER_NO, INSP_YN, SUPPLIER, LOC, WEIGHT, TOTAL_WEIGHT, MEMO, BARCODE);
}

/**
 * PrintHtml
 */
//function exWNPrintHtml(string_Export){
//	return M.execute('exPrintHtml',string_Export);
//}
function exWNPrintHtml(MOVETYPE, MOVENM, VENDOR_NM, MOVENO, MOVEDESC, CREATE_NM, TOTAL, PART_CD, PART_QTY, PART_NM, BASIC_UNIT, MOVE_DT){
	return M.execute('exPrintHtml',MOVETYPE, MOVENM, VENDOR_NM, MOVENO, MOVEDESC, CREATE_NM, TOTAL, PART_CD, PART_QTY, PART_NM, BASIC_UNIT, MOVE_DT);
}