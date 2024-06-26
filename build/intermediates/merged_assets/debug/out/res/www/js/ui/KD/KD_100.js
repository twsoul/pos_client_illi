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

    var vendor_cd = "";
    var wh_cd = "";
    var Box_No_List = [];
    var C1_List = [];
    var C2_List = [];
    var C3_List = [];

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

        $(window).on('keydown', function (e) {
            if (e.key === 'Tab' || e.keyCode === 9) {
                e.preventDefault();
                focusOut();
            }
        });

        // 플랜트 변경 시 반납창고 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("40");
        })

        // 반납창고 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
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
                    StorageLocationReq("40");
                }
            }
        });
    };

    // 반납창고 콤보박스 정보 조회
    var StorageLocationReq = function(type) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LocCodeList.do',
            data: {
                'PLANT': $("#selPLANT option:selected").val(),
                'TYPE': [type]
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
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        if(inputScan.length > 0) {
            if($("#txtBOX_NO").text()== ""){
                BoxNoScan(inputScan);
            } else {
                clear();
                BoxNoScan(inputScan);
            }
        }
    }

    // 부품식별표(KD) 스캔 시
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO': box_barcode,
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
                if(rowData.HOLD_FLAG == "Y"){
                    popupManager.instance($("[data-lng='MSG.0000000315']").text(), {showtime:"LONG"}); // 보류상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 시 플랜트 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                vendor_cd = rowData.VENDOR_CD;
                wh_cd = rowData.WH_CD;
                $("#txtBOX_NO").text(rowData.BOX_NO);
                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtBAR_QTY").text(rowData.BAR_QTY);
                $("#txtWH_CD").text(rowData.WH_NM == undefined ? "" : rowData.WH_NM);
                $("#txtBOX_IN_QTY").val(rowData.BOX_IN_QTY);
                if(rowData.BOX_IN_QTY == 0){
                    $("#txtBARQTY").text(0);
                } else {
                    $("#txtBARQTY").text(Math.ceil(parseInt($("#txtBAR_QTY").text()) / $("#txtBOX_IN_QTY").val()));
                }


                C3_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":rowData.WH_CD, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "USER_ID":getUSER_ID, "RTN_MSG":""});

                if(rowData.BOX_IN_QTY != 0){
                    focusOut();
                }
            }
        });
    };

    var focusOut = function(){
        console.log("focusOut");
        var index = 0;
        var total = Number($("#txtBAR_QTY").text());
        var barinqty = Number($("#txtBOX_IN_QTY").val());
        var error_flag = false;

        C1_List.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "PART_CD":$("#txtPART_CD").text(), "RTN_MSG":"", "RTN_BOX":""});
        $("#list_kd_100").html("");

        for(var i=0;i < Number($("#txtBARQTY").text());i++){
            console.log("focusOut");
            if(error_flag){
                console.log("error");
                $("#list_kd_100").html("");
                break;
            }
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/PR_PDA_KD_100_C1.do',
                data: {
                    'param1': C1_List
                },
                success: function(receivedData, setting) {
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    if(receivedData.resultBoxNo == ""){
                        popupManager.instance($("[data-lng='MSG.0000000379']").text(), {showtime:"LONG"}); // 분할 부품식별표 생성에 실패 하였습니다
                        return;
                    }

                    if(total < barinqty){
                        tag += template.replace(/\{\{NO\}\}/, index+1)
                                       .replace(/\{\{BOX_NO\}\}/, receivedData.resultBoxNo)
                                       .replace(/\{\{BAR_QTY\}\}/, total)
                    }else {
                        tag += template.replace(/\{\{NO\}\}/, index+1)
                                       .replace(/\{\{BOX_NO\}\}/, receivedData.resultBoxNo)
                                       .replace(/\{\{BAR_QTY\}\}/, barinqty)
                    }

                    $("#list_kd_100_head").removeClass("blind");
                    $("#list_kd_100").append(tag);
                    console.log("resultBoxNo : "+receivedData.resultBoxNo);

                    total -= barinqty;
                    index++;
                },
                error: function(errorCode, errorMessage, settings) {
                    console.log("error");
                    error_flag = true;
                }
            });
        }
        C1_List.length = 0;
        $("#txtBOX_IN_QTY").blur();
    }

    // 저장 시 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_Chk = true;
        if($("#list_kd_100 .tableCont").length == 0){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($("#list_kd_100 .tableCont").length != $("#txtBARQTY").text()){
            popupManager.instance($("[data-lng='MSG.0000000502']").text(), {showtime:"LONG"}); // 분할 부품식별표 생성 중 오류가 발생했습니다 초기화 하고 다시 시도해 주십시오
            $("#inputScan").focus();
            return;
        }
        // 리스트 정보를 Box_No_List 리스트에 추가
        $("#list_kd_100 .tableCont").each(function() {
            C2_List.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "WH_CD":wh_cd, "N_BOX_NO":$(this).find(".BOX_NO").text(), "BOX_NO":$("#txtBOX_NO").text(), "VENDOR_CD":vendor_cd, "PART_CD":$("#txtPART_CD").text(), "DIV_QTY":$(this).find(".BAR_QTY").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        $.each(C2_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        save();
    }

    // PR_PDA_OT_050_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_100_C2.do',
            data: {
                'param1': C2_List,
                'param2': C3_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                clear();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_100").html("");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#list_kd_100_head").addClass("blind");

        vendor_cd = "";
        wh_cd = "";
        $("#txtBOX_NO").text("");
        $("#txtPART_CD").text("");
        $("#txtBAR_QTY").text(0);
        $("#txtWH_CD").text("");
        $("#txtBOX_IN_QTY").val(0);
        $("#txtBARQTY").text(0);

        C1_List.length = 0;
        C2_List.length = 0;
        C3_List.length = 0;

        saveflag = false;

        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        if($(obj).val() == ""){
            $(obj).val(1);
            $(obj).click();
        }

        if( Number($(obj).val()) > Number($("#txtBAR_QTY").text())){
            popupManager.instance($("[data-lng='MSG.0000000256']").text(), {showtime:"LONG"}); // 스캔 수량을 초과했습니다
            $(obj).val(1);
        }
        if( Number($(obj).val()) <= 0){
            popupManager.instance($("[data-lng='MSG.0000000497']").text(), {showtime:"LONG"}); // 적입수량이 0이하입니다
            $(obj).val(1);
        }
        $("#txtBARQTY").text(Math.ceil(Number($("#txtBAR_QTY").text()) / $("#txtBOX_IN_QTY").val()));
    };

    // BOX_No이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;

        $("#list_ot_050 .tableCont").each(function() {
            if($(this).data("boxno") == box_no){
                rtn = true;
                return false; // each문의 break;
            }
        });

        return rtn;
    };

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		inputEvent: inputEvent,
		focusOut: focusOut
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