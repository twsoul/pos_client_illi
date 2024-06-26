/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Order_No_List = [];
    var Bar_No_List = [];
    var Export_List = [];
    var PART_CD = [];
    var PART_NM = [];
    var PART_QTY = [];
    var BASIC_UNIT = [];

    var over_chk = false;
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;
    var TOTAL = 0;
    var move_seq = 1;
    var VENDOR_NM = "";
    var MOVE_DESC = "";
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
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
        $("#selLOCTP").on('change', function() {
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
            	'TYPE': ["90"]
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    $("#selLOCTP").html("");
        	    if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LOC_TP + "'>" + rowData.LOC_NM + "</option>";
                     });
                }
                $("#selLOCTP").append(tag);
        	}
        });
        $("#inputScan").focus();
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();
        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        if(inputScan.length > 0) {
            if($("#txtORDR_NO").text()== ""){
                OtOrder(inputScan);
            } else {
                BoxNoInfo(inputScan);
            }
        }
    }

    // 반출번호 정보 조회 함수
    var OtOrder = function(move_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_045_S1.do',
            data: {
                'MOVE_NO':move_no,
                'LANG':getLNG,
                'event':'반출번호 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.MOVE_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000288']").text(), {showtime:"LONG"}); // 이미 반출된 반출번호입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 후 플랜트, 저장위치, 반출증/유무, 반출유형 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_pd_045_head").removeClass("blind");
                    tag += template.replace(/\{\{MOVE_SEQ\}\}/gi, rowData.MOVE_SEQ)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{MOVE_NO\}\}/, rowData.MOVE_NO)
                                   .replace(/\{\{MOVE_TYPE\}\}/, rowData.MOVE_TYPE)
                                   .replace(/\{\{MOVE_GB\}\}/, rowData.MOVE_GB)
                                   .replace(/\{\{MOVE_DESC\}\}/, rowData.MOVE_DESC)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{MOVE_QTY\}\}/gi, rowData.MOVE_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{SCAN_QTY\}\}/gi, rowData.SCAN_QTY)
                                   .replace(/\{\{MOVE_YN\}\}/, rowData.MOVE_YN);
                   $("#list_pd_045").append(tag);
                   $("#txtORDR_NO").text(rowData.MOVE_NO);
                   // 전체 스캔 수량
                   Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);
                   $("#inputScan").focus();
                });
            }
        });
    };

    // 팔레트 조회 함수
    var BoxNoInfo = function(boxBarCode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectPlalletNoSCM.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
                'event':'팔레트 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_no_exists = false;
                var part_cd_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000366']").text(), {showtime:"LONG"}); // 보류상태의 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.CNT == 0) {
                    popupManager.instance($("[data-lng='MSG.0000000367']").text(), {showtime:"LONG"}); // 맵핑되지 않은 팔레트입니다
                    $("#inputScan").focus();
                    return;
                }

                // 팔레트 중복 스캔 방지
                $.each(Bar_No_List,function(key,value){
                      $.each(value,function(key,value){
                            if(value == rowData.BAR_NO){
                                box_no_exists = true;
                            }
                      });
                 });

                if(box_no_exists){
                    popupManager.instance($("[data-lng='MSG.0000000392']").text(), {showtime:"LONG"}); // 이미 맵핑된 팔레트 입니다
                    $("#inputScan").focus();
                    return;
                } else {
                    $.each(receivedData.ListData, function(index,rowData){
                        $("#list_pd_045 .tableCont").each(function() {
                            if($(this).find(".PART_CD").text() == rowData.PART_CD){
                                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.CNT));

                                // 스캔한 수량이 불출할 수량 보다 많을 경우 과납 플래그(품번기준 수량)
                                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                                    over_chk = true;
                                }

                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                Tot_Scan_Qty += parseInt(rowData.CNT);
                                move_seq = $(this).find(".MOVE_SEQ").text();

                                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체스캔수량과 전체지시수량이 일치 할때
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔수량이 지시수량을 초과 할때(전체 수량)
                                    over_chk = true;
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                                part_cd_exists = true;
                            }
                        });
                    });
                }

                if(!part_cd_exists){
                    popupManager.instance($("[data-lng='MSG.0000000290']").text(), {showtime:"LONG"}); // 반출목록에 해당 품번이 존재하지 않습니다
                } else {
                    Bar_No_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "MOVE_SEQ": move_seq, "MOVE_NO":$("#txtORDR_NO").text(), "MOVE_QTY":rowData.PACK_QTY, "BAR_NO":rowData.BAR_NO, "USER_ID":getUSER_ID, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty != Tot_Deli_Qty){
            popupManager.instance($("[data-lng='MSG.0000000292']").text(), {showtime:"LONG"}); // 스캔수량과 지시수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if((Tot_Scan_Qty == Tot_Deli_Qty) && (over_chk == true)) {
            popupManager.instance($("[data-lng='MSG.0000000292']").text(), {showtime:"LONG"}); // 스캔수량과 지시수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false) {
            save();
        }
    }

    // PR_PDA_PD_045_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_045_C1.do',
            data: {
                'param1': Bar_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    saveflag = false;
                }
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        console.log("clear");

        $("#list_pd_045").html("");
        $("#txtORDR_NO").text("");
        $("#list_pd_045_head").addClass("blind");

        Bar_No_List.length = 0;
        PART_CD.length = 0;
        over_chk = false;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        move_seq = 1;

        over_chk = false;
        VENDOR_NM = "";
        MOVE_DESC = "";
        TOTAL = 0;

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        saveflag = false;
        $("#inputScan").focus();
    }

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack
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
}).onBack(function() {
	// 안드로이드 뒤로가기 버튼 클릭시 호출
	page.moveToBack();
});