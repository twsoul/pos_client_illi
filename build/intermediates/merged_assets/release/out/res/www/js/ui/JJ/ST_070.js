/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var RACK_List = [];
    var Box_No_List = [];
    var rack_Exists = false;

    var wh_cd = "";
    var rack_cd = "";
    var loc_cd = "";
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
        if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        PlantReq();
        $("#inputScan").focus();
	};

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();

                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            setClearClickEvent();
        })
    };

    // 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PlantCodeList.do',
            data: {
                'LANG': getLNG,
                'WERKS': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selPLANT").html("");
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{
                    var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VALUE + "'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);

                    StorageLocationReq();
                }
            }
        });
    };

    // 저장 위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["10"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selLOCTP").html("");
        	    tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
                if($("#selPLANT").val() == getWERKS) {
                    $("#selLOCTP").val(getLGORT).prop("selected", true);
                }
        	}
        });
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            if($("#txtRACK").text()== ""){
                RackOrder(inputScan);
            } else {
                BoxNoScan(inputScan);
            }
        }
    }

    // RACK 조회 함수
    var RackOrder = function(rack_Bar) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectRackCode.do',
            data: {
                'RACK_BAR':rack_Bar,
                'event':'RACK 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000305']").text(), {showtime:"LONG"}); // RACK 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }
                wh_cd = rowData.WH_CD;
                rack_cd = rowData.RACK_CD;
                loc_cd = rowData.LOC_CD;

                if (rowData.PART_CNT == 0) {
                    rack_Exists = false;
                } else if(rowData.PART_CNT > 0){
                    rack_Exists = true;
                    $.each(receivedData.ListData, function(index,rowData){
                        RACK_List.push({"PART_CD":rowData.PART_CD});
                    });
                }
                $("#txtRACK").text(rowData.RACK_LOC_NM);
                $("#inputScan").focus();
            }
        });
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_no_exists = false;
                var part_cd_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                // 부품식별표 중복 체크
                if(rack_Exists == true){
                    $.each(RACK_List,function(key,value){
                        $.each(value,function(key,value){
                            if(value == rowData.PART_CD){
                                box_no_exists = true;
                            }
                        });
                    });
                } else {
                    box_no_exists = true;
                }

                if(box_no_exists) {
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_st_070_head").removeClass("blind");
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                    tag += template.replace(/\{\{COPORATE_CD\}\}/gi, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                                   .replace(/\{\{LOC_TP_TYPE\}\}/, rowData.LOC_TP_TYPE)
                                   .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO);
                    $("#list_st_070").prepend(tag);
                    Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "BOX_NO":rowData.BOX_NO, "WH_CD":wh_cd, "LOC_CD":loc_cd, "RACK_CD":rack_cd, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "BAR_QTY":rowData.BAR_QTY, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM,  "RTN_MSG":""});
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000309']").text(), {showtime:"LONG"}); // RACK 정보에 해당 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_Chk = true;
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_ST_070_C1.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    clear();
                }
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_st_070").html("");
        $("#txtRACK").text("");

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#list_st_070_head").addClass("blind");

        $("#inpBoxQty").text("0");
        rack_Exists = false;
        RACK_List.length = 0;
        Box_No_List.length = 0;
        wh_cd = "";
        rack_cd = "";
        loc_cd = "";
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;

        $("#list_st_070 .tableCont").each(function() {
            if($(this).data("boxno") == box_no){
                rtn = true;
                return false; // each문의 break;
            }
        });

        return rtn;
    };

	// 자식창에 갔다가 돌아왔을때 리로드용
	var setReloadEvent = function() {

	};

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		setReloadEvent: setReloadEvent
	};
})(window, document, $, M);

/*******************************************************************
*	MCore Common Events
*******************************************************************/
M.onReady(function(e) {
	page.setInitScreen();
	page.setInitEvent();
}).onHide(function(e){
	// 화면 이동 전에 호출
}).onRestore(function(e) {
	// 해당화면으로 다시 돌아왔을때 호출
	page.setReloadEvent();
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});