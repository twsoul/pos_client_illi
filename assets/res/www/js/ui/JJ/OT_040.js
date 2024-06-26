/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT20 = optionManager.getLGORT20();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var C1_LIST = [];
    var Box_No_Arr = [];
    var rack_Exists = false;
    var saveflag = false;

    var PLANT = "";
    var LOCTP = "";

	// 화면 초기화
	var setInitScreen = function() {
        if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        // 이전 화면에서 넘어온 값이 있을 때 초기화 부분
        PLANT = dataManager.param("PLANT");
        LOCTP = dataManager.param("LOCTP");

        console.log("PLANT : "+PLANT);
        console.log("LOCTP : "+LOCTP);

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

        // 플랜트 변경 시 현창 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            clear();
            StorageLocationReq();
        })

        // 현창 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function() {
            clear();
            if($("#selLOCTP option:selected").val() != "" && $("#selLOCTP option:selected").val() != undefined){
                ListInfo();
            }
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function() {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function() {
            clear();
            if($("#selLOCTP option:selected").val() != "" && $("#selLOCTP option:selected").val() != undefined){
                ListInfo();
            }
        })
    };

    // 플랜트 콤보박스 정보 조회
    var PlantReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PlantCodeList.do',
            data: {
                'LANG': optionManager.getLNG(),
                'WERKS': userManager.getCORP_CD()
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

                    // 이전 화면에서 설정된 플랜트 정보로 플랜트 값 설정
                    if(PLANT != "" && PLANT != null && PLANT != undefined) {
                        $("#selPLANT").val(PLANT).prop("selected", true);
                    }else{
                        $("#selPLANT").val(getWERKS).prop("selected", true);
                    }

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
            	'TYPE': ["20"]
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

                // 이전 화면에서 설정된 저장위치 정보로 저장위치 값 설정
                if(LOCTP != "" && LOCTP != null && LOCTP != undefined) {
                    if($("#selPLANT option:selected").val() == PLANT) {
                        $("#selLOCTP").val(LOCTP).prop("selected", true);
                    }
                }else if($("#selPLANT option:selected").val() == getWERKS) {
                    $("#selLOCTP").val(getLGORT20).prop("selected", true);
                }
                if($("#selLOCTP option:selected").val() != "" && $("#selLOCTP option:selected").val() != undefined){
                    ListInfo();
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
        console.log("inputScan : "+inputScan);

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if(head_tail_chk(inputScan)){
                BoxNoScan(inputScan);
            }else{
                if(inputScan.indexOf("*") != -1){
                    inputScan = inputScan.split("*")[1];
                }
                if($("#list_ot_040 .tableCont").length == 0){
                    popupManager.instance($("[data-lng='MSG.0000000250']").text(), {showtime:"LONG"}); // 스캔할 리스트가 없습니다
                    $("#inputScan").focus();
                    return;
                }
                if(!IsNotExitList(inputScan)){ // 리스트에 해당 품번이 존재하지 않을경우
                    popupManager.instance($("[data-lng='MSG.0000000251']").text(), {showtime:"LONG"}); // 이종품불출내역에 존재하지 않는 PART NO입니다
                    $("#inputScan").focus();
                    return;
                } else{
                    $("#txtRACK").text(inputScan);
                    $("#inputScan").focus();
                }
            }
        }
    }

    var head_tail_chk = function(inputScan){
        var head,tail;
        head = inputScan.substr(0,4);
        tail = inputScan.substr(inputScan.length-4,4);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // 이종확인 불출 리스트 조회
    var ListInfo = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_040_S1.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'PLANT_CD':$("#selPLANT option:selected").val(),
                'LOC_TP':$("#selLOCTP option:selected").val(),
                'USER_ID':getUSER_ID,
                'event':'이종불출목록 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000538']").text(), {showtime:"LONG"}); // 조회된 데이터가 없습니다
                    $("#inputScan").focus();
                    return;
                }

                var tag = "";
                var template = $("#ListTemplate").html();

                $("#list_ot_040_head").removeClass("blind");
                tag += template.replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                               .replace(/\{\{SUM_QTY\}\}/, rowData.SUM_QTY)
                               .replace(/\{\{SCAN_QTY\}\}/, 0);
                $("#list_ot_040").prepend(tag);

                $("#inputScan").focus();
            }
        });
    }

    // 부품식별표 조회(이종품) 함수
    var BoxNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_040_S2.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'event':'정보 수신 및 전송'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var exists = false;
                var bar_exists = false;
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DKIND == "N") {
                    popupManager.instance(rowData.PART_CD +" " + $("[data-lng='MSG.0000000540']").text(), {showtime:"LONG"}); // 이종품이 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.CONF_F == "Y") {
                    popupManager.instance(rowData.BOX_NO +" " + $("[data-lng='MSG.0000000541']").text(), {showtime:"LONG"}); // 이미 이종체크가 완료된 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE == 10) {
                    popupManager.instance(rowData.BOX_NO +" " + $("[data-lng='MSG.0000000539']").text(), {showtime:"LONG"}); // 아직 출고되지 않은 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DATE_FLAG == "N") {
                    popupManager.instance(rowData.BOX_NO +" " + $("[data-lng='MSG.0000000542']").text(), {showtime:"LONG"}); // 당일 불출된 부품식별표가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.MODIFY_USER != getUSER_ID) {
                    popupManager.instance(rowData.MODIFY_USER +" " + $("[data-lng='MSG.0000000553']").text(), {showtime:"LONG"}); // 불출한 사용자가 다릅니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan1").focus();
                    return;
                }
                Box_No_Arr.forEach(function(arr){
                    if(rowData.BOX_NO == arr){
                        bar_exists = true;
                    }
                });
                if(!bar_exists){
                    Box_No_Arr.push(rowData.BOX_NO);
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                $("#list_ot_040 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));

                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        exists = true;
                    }
                });
                if(!exists){
                    Box_No_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000543']").text(), {showtime:"LONG"}); // 품번이 리스트에 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }else{
                    C1_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":$("#selPLANT option:selected").val(), "LOC_TP":$("#selLOCTP option:selected").val(), "BOX_NO":rowData.BOX_NO, "WORK_NM":getUSER_NM, "WORK_ID":getUSER_ID, "RTN_MSG":""});
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
        if($("#txtRACK").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000544']").text(), {showtime:"LONG"}); // RACK바코드 먼저 스캔하십시오
            $("#inputScan").focus();
            return;
        }
        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        save();
    }

    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_040_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    if(PLANT != ""){
                        clear();
                        moveToBack();
                    } else {
                        clear();
                        ListInfo();
                    }

                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                    ListInfo();
                }
            }
        });
    }

    // 화면 초기화
    var clear = function() {
        $("#list_ot_040").html("");
        $("#txtRACK").text("");

        $("#list_ot_040_head").addClass("blind");

        $("#inpBoxQty").text("0");
        rack_Exists = false;
        Box_No_Arr.length = 0;
        C1_LIST.length = 0;

        LOCTP = "";
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(part_cd){
        var rtn = false;

        $("#list_ot_040 .tableCont").each(function() {
            if($(this).find(".PART_CD").text() == part_cd){
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