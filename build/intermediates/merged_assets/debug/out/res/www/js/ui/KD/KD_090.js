/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Box_No_List_C2 = [];
    var Box_No_List_C3 = [];
    var New_Box_No_List = [];
    var test = [];

    var N_BOX_NO = "";
    var in_dt = 0;
    var strdttm = "";

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
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on("change", function() {
            StorageLocationReq();
        });

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 신규식별표 생성 체크 여부
        $("#chk_Info").on("change", function() {
            if ($("#chk_Info").prop("checked")) { // 체크 됨
                clear();
            } else { // 체크 해제 됨
                clear();
            }
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on("click", function() {
            setSaveClickEvent();
        });

        // 초기화 버튼 클릭 시
        $("#btnInit").on("click", function() {
            setClearClickEvent();
        });
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
    		        popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
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

    // 저장위치 콤보박스 정보 조회
    var StorageLocationReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/LocCodeList.do',
        	data: {
            	'PLANT': $("#selPLANT option:selected").val(),
            	'TYPE': ["40"]
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

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        var userPlantCheck = $("#selPLANT").val();
        var userLocTpCheck = $("#selLOCTP").val();

        if(userPlantCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치을 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_No_Bar){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO': box_No_Bar,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

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
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()){
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE != 40) {
                    popupManager.instance($("[data-lng='MSG.0000000378']").text(), {showtime:"LONG"}); // 현재 KD창고에 존재하는 부품식별표가 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (IsNotExitList(rowData.BOX_NO)) {
                    popupManager.instance($("[data-lng='MSG.0000000244']").text(), {showtime:"LONG"}); // 이미 리스트에 존재하는 BOX NO 입니다
                    $("#inputScan").focus();
                    return;
                }
                if(($("#txtBOX_NO").text() != "") && (rowData.PART_CD != $("#txtPART_CD").text())) {
                    popupManager.instance($("[data-lng='MSG.0000000299']").text(), {showtime:"LONG"}); // 대상 부품식별표와 품번이 다릅니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.BAR_QTY == "0"){
                    popupManager.instance($("[data-lng='MSG.0000000303']").text(), {showtime:"LONG"}); // 해당 부품식별표의 수량이 0개 입니다
                    $("#inputScan").focus();
                    return;
                }
                // 신규식별표 생성시
                if($("#chk_Info").prop("checked")){
                    if(rowData.BAR_QTY <= 1){
                        popupManager.instance($("[data-lng='MSG.0000000308']").text(), {showtime:"LONG"}); // 1개 이하의 부품식별표는 신규 부품식별표를 생성 할 수없습니다
                        return;
                    }
                }

                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                var tag = "";
                var template = $("#ListTemplate").html();
                tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                               .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                               .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                               .replace(/\{\{LOC_TP_TYPE\}\}/, rowData.LOC_TP_TYPE)
                               .replace(/\{\{WH_CD\}\}/, rowData.WH_CD == undefined ? "" : rowData.WH_CD)
                               .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                               .replace(/\{\{MAKE_SEQ\}\}/gi, rowData.MAKE_SEQ)
                               .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                               .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                               .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                               .replace(/\{\{BASIC_UNIT\}\}/, rowData.BASIC_UNIT)
                               .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                               .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                               .replace(/\{\{BOX_BAR_NO\}\}/, rowData.BOX_BAR_NO)
                               .replace(/\{\{BOX_IN_QTY\}\}/, rowData.BOX_IN_QTY)
                               .replace(/\{\{BOX_OUT_FLAG\}\}/, rowData.BOX_OUT_FLAG)
                               .replace(/\{\{HOLD_FLAG\}\}/, rowData.HOLD_FLAG);

               // IN_DT 처리
               if(rowData.IN_DT != null && rowData.IN_DT != undefined && rowData.IN_DT != "undefined"){
                   if(Number(rowData.IN_DT) > in_dt || in_dt == 0){
                       in_dt = Number(rowData.IN_DT);
                   }
               }
               if(in_dt != 0){ // PRE_INSP_DTTM값이 null인경우 ""값을 넘겨줌
                   strdttm = in_dt.toString();
               }

                // 신규 식별표 생성 시
                if ($("#chk_Info").prop("checked")) {
                    if($("#txtBOX_NO").text() == ""){
                        $("#list_kd_090_head").removeClass("blind");
                        $("#txtPART_CD").text(rowData.PART_CD);
                        $("#txtBARQTY").text(rowData.BAR_QTY);
                        $("#txtEXPQTY").text(rowData.BAR_QTY);
                        New_Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "PART_CD":rowData.PART_CD, "RTN_MSG":"", "RTN_BOX":""})
                        NewBoxNoInfo();
                        Box_No_List_C3.push({"CHECK_YN":"Y", "COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":rowData.WH_CD == undefined ? "" : rowData.WH_CD, "N_BOX_NO":$("#txtBOX_NO").text(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "EXP_QTY":"", "IN_DT":"",  "USER_ID":getUSER_ID, "RTN_MSG":""});
                    } else{
                        var barqty = 0;
                        barqty = parseInt($("#txtBARQTY").text()) +parseInt(rowData.BAR_QTY);
                        $("#txtBARQTY").text(barqty);
                        $("#txtEXPQTY").text(barqty);
                    }
                    $("#list_kd_090").prepend(tag);
                    Box_No_List_C2.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":rowData.WH_CD == undefined ? "" : rowData.WH_CD, "N_BOX_NO":$("#txtBOX_NO").text(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "MRG_QTY":rowData.BAR_QTY, "USER_ID":getUSER_ID, "RTN_MSG":""});
                } else { // 기존 식별표와 병합시
                    if($("#txtBOX_NO").text() == ""){
                        $("#list_kd_090_head").removeClass("blind");
                        $("#txtBOX_NO").text(rowData.BOX_NO);
                        $("#txtPART_CD").text(rowData.PART_CD);
                        $("#txtBARQTY").text(rowData.BAR_QTY);
                        $("#txtEXPQTY").text(rowData.BAR_QTY);
                        Box_No_List_C3.push({"CHECK_YN":"N", "COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":rowData.WH_CD == undefined ? "" : rowData.WH_CD, "N_BOX_NO":$("#txtBOX_NO").text(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "EXP_QTY":"", "IN_DT":"", "USER_ID":getUSER_ID, "RTN_MSG":""});
                    } else if(rowData.BOX_NO == $("#txtBOX_NO").text()){ // 같은 부품식별표를 중복으로 스캔 했을 경우
                        popupManager.instance($("[data-lng='MSG.0000000300']").text(), {showtime:"LONG"}); // 병합하고자 하는 부품식별표입니다
                        $("#inputScan").focus();
                        return;
                    } else {
                        var barqty = 0;
                        $("#list_kd_090").prepend(tag);
                        barqty = parseInt($("#txtEXPQTY").text()) +parseInt(rowData.BAR_QTY);
                        $("#txtEXPQTY").text(barqty);
                        Box_No_List_C2.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":rowData.WH_CD == undefined ? "" : rowData.WH_CD, "N_BOX_NO":$("#txtBOX_NO").text(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "MRG_QTY":rowData.BAR_QTY, "USER_ID":getUSER_ID, "RTN_MSG":""});
                    }
                }
                $("#inputScan").focus();
            }
        });

    }

    // 신규 식별표 생성
    var NewBoxNoInfo = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_090_C1.do',
            data: {
                'param1':New_Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.resultBoxNo == ""){
                    popupManager.instance($("[data-lng='MSG.0000000323']").text(), {showtime:"LONG"}); // 신규 부품식별표 생성에 실패 하였습니다
                    clear();
                }
                $("#txtBOX_NO").text(receivedData.resultBoxNo);

                New_Box_No_List.length = 0;
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
                popupManager.instance($("[data-lng='MSG.0000000323']").text(), {showtime:"LONG"}); // 신규 부품식별표 생성에 실패 하였습니다
                clear();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtBOX_NO").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($(".BOX_NO").text() == ""){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $.each(Box_No_List_C2,function(key){
            Box_No_List_C2[key]['N_BOX_NO'] = $("#txtBOX_NO").text();
        });

        $.each(Box_No_List_C3,function(key){
            Box_No_List_C3[key]['IN_DT'] = strdttm;
        });

        Box_No_List_C3['0']['EXP_QTY'] = $("#txtEXPQTY").text();
        Box_No_List_C3['0']['N_BOX_NO'] = $("#txtBOX_NO").text();
        Box_No_List_C2['0']['N_BOX_NO'] = $("#txtBOX_NO").text();

        $.each(Box_No_List_C2,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        $.each(Box_No_List_C3,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // 병합 부품식별표 저장 함수
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_090_C2.do',
            data: {
                'param1': Box_No_List_C2,
                'param2': Box_No_List_C3
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance(receivedData.result, {showtime:"LONG"}); // 저장 실패
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                clear();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    }

    // 화면 초기화
    var clear = function() {
        $("#list_kd_090").html("");
        $("#txtBOX_NO").text("");
        $("#txtPART_CD").text("");
        $("#txtBARQTY").text("");
        $("#txtEXPQTY").text("");

        $("#list_kd_090_head").addClass("blind");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);

        Box_No_List_C2.length = 0;
        Box_No_List_C3.length = 0;
        in_dt = 0;
        strdttm = "";
        saveflag = false;
        $("#inputScan").focus();
    }

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;

        if ($("#chk_Info").prop("checked")) {
            $("#list_kd_090 .tableCont").each(function() {
                if($(this).data("boxno") == box_no){
                    rtn = true;
                    return false; // each문의 break;
                }
            });
        } else {
            $("#list_kd_090 .tableCont").each(function() {
                if($(this).data("boxno") == box_no){
                    rtn = true;
                    return false; // each문의 break;
                }
            });
        }

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