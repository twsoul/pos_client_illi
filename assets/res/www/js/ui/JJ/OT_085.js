/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT20 = optionManager.getLGORT20();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Order_No_List = [];
    var Box_No_List = [];
    var C1_List = [];
    var Export_List = [];
    var PART_CD = [];
    var PART_NM = [];
    var PART_QTY = [];
    var BASIC_UNIT = [];

    var saveflag = false;
    var over_chk = false;
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;
    var TOTAL = 0;
    var move_seq = 1;
    var VENDOR_NM = "";
    var MOVE_DESC = "";
    var MOVE_CASE = "";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
        ComTypeReq();
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
        $("#selLOCTP").on('change', function() {
            $("#inputScan").focus();
        })

        // 반출증 유/무 변경시
        $("#selYN").on('change', function() {
            clear();
        })

        // 반출유형 변경시 스캔 포커스
        $("#selTYPE").on('change', function() {
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
            	'TYPE': ["20"]
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
                if($("#selPLANT option:selected").val() == getWERKS){
                    $("#selLOCTP").val(getLGORT20).prop("selected", true);
                }
        	}
        });
        $("#inputScan").focus();
    }

    // 반출유형 정보 조회 함수
    var ComTypeReq = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_085_S2.do',
            data: {
                'COPORATE_CD':getCORP_CD,
                'LANG':getLNG,
                'event':'반출유형 정보 조회'
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selTYPE").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "' value1='" + rowData.COM_CD +"' value2='" + rowData.COM_CD_REF + "' value3='" + rowData.COM_NM + "'>" + rowData.COM_NM + "</option>";
                     });
                }
                $("#selTYPE").append(tag);
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
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }
        if(inputScan.length > 0) {
            if($("#selYN").val() == "Y"){ // 반출증이 존재 할 때
                if($("#txtORDR_NO").text()== ""){
                    OtOrder(inputScan);
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000478']").text(), {showtime:"LONG"}); // 이미 반출증을 스캔하셨습니다
                    $("#inputScan").focus();
                    return;
                }
            } else if($("#selYN").val() == "N") { // 반출증이 존재 하지 않을 때
                if($("#selTYPE").val() == ""){
                    popupManager.instance($("[data-lng='MSG.0000000312']").text(), {showtime:"LONG"}); // 반출유형을 먼저 선택하십시오
                    $("#inputScan").focus();
                    return;
                } else {
                    BoxNoInfo_N(inputScan);
                }
            }
        }
    }

    // 반출번호 정보 조회 함수
    var OtOrder = function(move_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_085_S1.do',
            data: {
                'MOVE_NO':move_no,
                'LANG':getLNG,
                'event':'반출번호 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];


                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                    $("#txtORDR_NO").text("");
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
                $("#selLOCTP").attr("disabled",true);
                $("#selPLANT").attr("disabled",true);
                $("#selYN").attr("disabled",true);
                $("#selTYPE").attr("disabled",true);

                // 반출 사유 없는경우 공백 처리 (반출증 존재 할 때 반출증을 출력 한다면 사용)
                if(rowData.MOVE_DESC == "" || rowData.MOVE_DESC == undefined || rowData.MOVE_DESC == "undefined"){
                    MOVE_DESC = "";
                }else{
                    MOVE_DESC = rowData.MOVE_DESC;
                }

                MOVE_CASE = rowData.MOVE_CASE;

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();
                    var exists = false;

                    $("#selTYPE").val(rowData.MOVE_GB).prop("selected", true);
                    $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);

                    $("#list_ot_085 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 무시
                            exists = true;
                        }
                    });

                    if(!exists){
                        $("#list_ot_085_head").removeClass("blind");
                        tag += template.replace(/\{\{MOVE_SEQ\}\}/gi, rowData.MOVE_SEQ)
                                       .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                       .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                       .replace(/\{\{MOVE_NO\}\}/, rowData.MOVE_NO)
                                       .replace(/\{\{MOVE_TYPE\}\}/, rowData.MOVE_TYPE)
                                       .replace(/\{\{MOVE_GB\}\}/, rowData.MOVE_GB)
                                       .replace(/\{\{MOVE_CASE\}\}/, rowData.MOVE_CASE)
                                       .replace(/\{\{MOVE_DESC\}\}/, rowData.MOVE_DESC)
                                       .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                       .replace(/\{\{MOVE_QTY\}\}/gi, rowData.MOVE_QTY)
                                       .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                       .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                       .replace(/\{\{BOX_NO\}\}/, rowData.BOX_NO)
                                       .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                       .replace(/\{\{MOVE_YN\}\}/, rowData.MOVE_YN);
                        $("#list_ot_085").append(tag);
                        $("#txtORDR_NO").text(rowData.MOVE_NO);
                        // 전체 스캔 수량
                        Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);
                    }
                    Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "MOVE_YN":$("#selYN").val(), "MOVE_SEQ": rowData.MOVE_SEQ, "MOVE_NO":rowData.MOVE_NO, "MOVE_QTY":rowData.SCAN_QTY, "BOX_NO":rowData.BOX_NO,"PART_CD":rowData.PART_CD, "VENDOR_CD":rowData.VENDOR_CD, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                });
                $("#inputScan").focus();
            }
        });
    };

    // 반출증 없을 경우 부품식별표 조회 함수
    var BoxNoInfo_N = function(boxBarCode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectBoxNo.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
                'event':'정보 수신 및 전송'
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
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP_TYPE == 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000498']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.BAR_QTY < 1) {
                    popupManager.instance($("[data-lng='MSG.0000000455']").text(), {showtime:"LONG"}); // 사용할 수 없는 부품식별표 입니다
                    $("#inputScan").focus();
                    return;
                }
                // 부품식별표 중복 스캔 여부 확인
                $.each(Box_No_List,function(key,value){
                      console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                      $.each(value,function(key,value){
                            if(value == rowData.BOX_NO){
                                box_no_exists = true;
                            }
                      });
                 });

                if(box_no_exists){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                } else {
                    $("#list_ot_085 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){
                            $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));
                            $(this).find(".MOVE_QTY").text(parseInt($(this).find(".MOVE_QTY").text()) + parseInt(rowData.BAR_QTY));
                            part_cd_exists = true;
                        }
                    });
                }

                if(!part_cd_exists){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_ot_085_head").removeClass("blind");
                    tag += template.replace(/\{\{MOVE_SEQ\}\}/gi, move_seq)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{PART_NM\}\}/, rowData.PART_NM)
                                   .replace(/\{\{BASIC_UNIT\}\}/, rowData.BASIC_UNIT)
                                   .replace(/\{\{MOVE_QTY\}\}/gi, rowData.BAR_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.BAR_QTY);
                    $("#list_ot_085").append(tag);
                }
                VENDOR_NM = rowData.VENDOR_NM;
                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                C1_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"MOVE_YN":"N", "MOVE_NO":$("#txtORDR_NO").text(), "MOVE_UNIT":rowData.BASIC_UNIT, "MOVE_TYPE":$("#selTYPE option:selected").attr('value2'), "MOVE_GB":$("#selTYPE option:selected").attr('value1'), "MOVE_QTY":1, "PART_CD":rowData.PART_CD, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":"", "RTN_MOVE":""});
                Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "MOVE_YN":$("#selYN").val(), "MOVE_SEQ": move_seq, "MOVE_NO":$("#txtORDR_NO").text(), "MOVE_QTY":1, "BOX_NO":rowData.BOX_NO,"PART_CD":rowData.PART_CD, "VENDOR_CD":rowData.VENDOR_CD, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                ProOrder();

                if(!part_cd_exists){
                    move_seq ++;
                }
                $("#inputScan").focus();
            }
        });
    }

    // 신규 반출증 생성 함수
    var ProOrder = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_085_C1.do',
            data: {
                'param1':C1_List
            },
            success: function(receivedData, setting) {
                if(receivedData.resultMoveNo == ""){
                    popupManager.instance($("[data-lng='MSG.0000000322']").text(), {showtime:"LONG"}); // 신규 반출증 생성에 실패 하였습니다
                    return;
                }
                // 새로 생성된 반출번호
                $("#txtORDR_NO").text(receivedData.resultMoveNo);

                C1_List.length = 0;
                $("#inputScan").focus();
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("error");
                C1_List.length = 0;
                clear();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var userTypeCheck = $("#selType").val();
        if($("#selYN").val() == "N") {
            Box_No_List['0']['MOVE_NO'] = $("#txtORDR_NO").text();
            save();
        } else if($("#selYN").val() == "Y"){
            save();
        }
    }

    // PR_PDA_OT_085_C2 호출 및 저장
    var save = function() {
        saveflag = true;
        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_085_C2.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    if($("#selYN").val() == "N") {
                        popupManager.alert($("[data-lng='MSG.0000000291']").text(), { // 반출증을 출력 하시겠습니까?
                        title: '반출증 출력 여부 메시지',
                        buttons: ['예', '아니오']
                        }, function(index) {
                             if (index == 1){ // 출력 안함
                                clear();
                                return;
                             } else { // 출력 함
                                var MOVETYPE = "";

                                // 리스트로 부터 출력 정보 추출
                                $("#list_ot_085 .tableCont").each(function() {
                                    PART_CD.push($(this).find(".PART_CD").text());
                                    PART_NM.push($(this).data("partnm"));
                                    BASIC_UNIT.push($(this).data("basicunit"));
                                    PART_QTY.push($(this).find(".MOVE_QTY").text());
                                    TOTAL += parseInt($(this).find(".MOVE_QTY").text());
                                });

                                // 코드로 되어있는 MOVE_TYPE 이름으로 변경
                                console.log("selTYPE : "+ $("#selTYPE option:selected").attr('value2'));
                                if($("#selTYPE option:selected").attr('value2') == "A"){
                                    MOVETYPE = "유상";
                                } else if($("#selTYPE option:selected").attr('value2') == "B") {
                                    MOVETYPE = "무상";
                                }

                                // exWNPrintHtml 파라미터 - MOVE_TYPE, MOVE_NM, VENDOR_NM, MOVE_NO, MOVE_DESC, CREATE_NM, TOTAL, PART_CD, PART_QTY, PART_NM, BASIC_UNIT, MOVE_DT
                                exWNPrintHtml(MOVETYPE, $("#selTYPE option:selected").attr('value3'), VENDOR_NM, $("#txtORDR_NO").text(), MOVE_DESC, getUSER_NM, TOTAL.toString(),JSON.stringify(PART_CD),JSON.stringify(PART_QTY),JSON.stringify(PART_NM),JSON.stringify(BASIC_UNIT),receivedData.resultMoveDt);

                                console.log("MOVETYPE : " + MOVETYPE);
                                console.log("TYPE : " + $("#selTYPE option:selected").attr('value3'));
                                console.log("VENDOR_NM : " + VENDOR_NM);
                                console.log("MOVE_NO : " + $("#txtORDR_NO").text());
                                console.log("MOVE_DESC : " + MOVE_DESC);
                                console.log("CREATE_NM : " + getUSER_NM);
                                console.log("TOTAL : " + TOTAL.toString());
                                console.log("PART_CD : " + JSON.stringify(PART_CD));
                                console.log("PART_QTY : " + JSON.stringify(PART_QTY));
                                console.log("PART_NM : " + JSON.stringify(PART_NM));
                                console.log("BASIC_UNIT : " + JSON.stringify(BASIC_UNIT));
                                console.log("MOVE_DT : " + receivedData.resultMoveDt);


                                clear();
                                return;
                             }
                        });
                    } else{
                        clear();
                    }
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
        console.log("clear");

        $("#list_ot_085").html("");
        $("#txtORDR_NO").text("");
        $("#list_ot_085_head").addClass("blind");

        Box_No_List.length = 0;
        C1_List.length = 0;
        PART_CD.length = 0;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;
        move_seq = 1;
        $("#inpBoxQty").text("0");
        saveflag = false;
        over_chk = false;
        VENDOR_NM = "";
        MOVE_DESC = "";
        TOTAL = 0;

        if($("#selYN").val() == "Y"){
            console.log("selYN Y selected");
            $("#inpBoxQty").text("0");
            $("#selTYPE").val('').prop("selected", true);
            $("#selTYPE").attr("disabled",true);
        } else if($("#selYN").val() == "N") {
            console.log("selYN N selected");
            $("#inpBoxQty").text("0");
            $("#selTYPE").val('').prop("selected", true);
            $("#selTYPE").attr("disabled",false);
        }

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selYN").attr("disabled",false);
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