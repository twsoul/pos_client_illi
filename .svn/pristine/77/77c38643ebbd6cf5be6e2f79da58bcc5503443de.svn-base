/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLGORT = optionManager.getLGORT();
    var getLNG = optionManager.getLNG();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var Box_No_List = [];
    var C2_LIST = [];

    var over_chk = false; // 품번 기준 과납 여부 플래그
    var deli_flag = false; // 요청번호가 스캔 되었는지 체크하는 플래그
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
                    console.log("스캔됨");
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function (e) {
            StorageLocationReq("10");
        })

        // 저장위치 변경 시 스캔 포커스
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
                    StorageLocationReq("10");
                }
            }
        });
    };

    // 저장위치 콤보박스 정보 조회
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
            $("#inputScan").focus();
            return;
        }
        if(userLocTpCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        if(inputScan.length > 0) {
            if(deli_flag == false) { // 스캔된 요청 번호가 없을 경우
                OrderInfo(inputScan);
            } else if(deli_flag == true) {
                if(Tot_Scan_Qty == Tot_Deli_Qty){
                console.log("스캔 불가");
                    return;
                }
                BoxNoScan(inputScan);
            }
        }
    }

    // 요청번호 조회 하는 함수
    var OrderInfo = function(orderNo){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/OT_110_S1.do',
            data: {
                'REQ_ETC_NO':orderNo,
                'PLANT_CD':$("#selPLANT").val(),
                'LANG':getLNG,
                'event':'요청번호 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000293']").text(), {showtime:"LONG"}); // 요청번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.OUT_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000294']").text(), {showtime:"LONG"}); // 이미 불출된 요청번호입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selPLANT").attr("disabled",true);
                $("#selLOCTP").attr("disabled",true);

                deli_flag = true;
                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_ot_110_head").removeClass("blind");
                    tag += template.replace(/\{\{No\}\}/gi, index+1)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{LOC_TP\}\}/, rowData.LOC_TP)
                                   .replace(/\{\{REQ_ETC_NO\}\}/, rowData.REQ_ETC_NO)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{REQ_QTY\}\}/gi, rowData.REQ_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM);
                   $("#list_ot_110").append(tag);
                   $("#txtORDR_NO").text(rowData.REQ_ETC_NO);
                   Tot_Deli_Qty += parseInt(rowData.REQ_QTY);
                });
                $("#inputScan").focus();
            }
        });
    }

    // 스캔 시 부품식별표별 품번 조회
    var BoxNoScan = function(boxBarCode) {
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
                if(rowData.LOC_TP_TYPE != 10) {
                    popupManager.instance(rowData.BOX_NO + $("[data-lng='MSG.0000000277']").text(), {showtime:"LONG"}); // 는 출고된 Box입니다.'||chr(13)||chr(10)||'Box No를 확인 바랍니다
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

                // 부품식별표 중복 스캔 방지
                $.each(Box_No_List,function(key,value){
                    $.each(value,function(key,value){
                        if(value == rowData.BOX_NO){
                            box_no_exists = true;
                        }
                    });
                });
                var nBox_flag = false;
                if(box_no_exists){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                } else {
                    $("#list_ot_110 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){


                            // 스캔한 수량이 불출할 수량 보다 많을 경우 과납 플래그(품번기준 수량)
                            if(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY) > parseInt($(this).find(".REQ_QTY").text())){
                                var exp_qty = (parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY))- parseInt($(this).find(".REQ_QTY").text());
                                var div_qty = rowData.BAR_QTY - exp_qty;
                                C2_LIST.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "DIV_QTY":div_qty, "PRE_INSP_DTTM":rowData.PRE_INSP_DTTM == undefined ? "" : rowData.PRE_INSP_DTTM, "INSP_FLAG":rowData.INSP_FLAG == undefined ? "" : rowData.INSP_FLAG, "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":"", "RTN_BOX":""});
                                newBox(rowData.BAR_QTY,exp_qty,div_qty,rowData.COPORATE_CD,rowData.VENDOR_CD,rowData.PART_CD);
                                nBox_flag = true;
                                return;
                            }

                            $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));

                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                            Tot_Scan_Qty += parseInt(rowData.BAR_QTY);

                            if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체 스캔 수량과 전체 불출 수량이 일치 할때
                                $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                            } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔 수향이 불출 수량을 초과 할때(전체 수량)
                                over_chk = true;
                                $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                            }
                            part_cd_exists = true;
                        }
                    });
                }

                if(!part_cd_exists && nBox_flag == false){
                    popupManager.instance($("[data-lng='MSG.0000000295']").text(), {showtime:"LONG"}); // 불출목록에 해당 부품식별표가 존재 하지 않습니다
                    $("#inputScan").focus();
                    return;
                } else if(nBox_flag == false){
                    Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PART_CD":rowData.PART_CD, "OUT_QTY":rowData.BAR_QTY, "REQ_ETC_NO":$("#txtORDR_NO").text(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});
                }
                $("#inputScan").focus();
            }
        });
    }

    var newBox = function(bar_qty, exp_qty, div_qty,cop,vend,part_cd){
        $.each(C2_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        popupManager.alert($("[data-lng='MSG.0000000460']").text()+"\r\n"+$("[data-lng='LB.0000000578']").text()+bar_qty+" / "+$("[data-lng='LB.0000000239']").text()+ exp_qty + " / "+$("[data-lng='LB.0000000157']").text()+div_qty, { // 부품식별표를 분할 하시겠습니까?
        title: $("[data-lng='MSG.0000000004']").text(), // 알림
        buttons: [$("[data-lng='MSG.0000000002']").text(), $("[data-lng='MSG.0000000003']").text()] // 확인, 취소
        }, function(index) {
            if (index == 1){
                console.log("취소");
                C2_LIST.length = 0;
                return;
            }else{
                console.log("확인");
                networkManager.httpSend({
                    server: saveUserCo,
                    path: 'api/PR_PDA_OT_110_C2.do',
                    data: {
                        'param1':C2_LIST
                    },
                    success: function(receivedData, setting) {
                        if(receivedData.resultBoxNo == ""){
                            popupManager.instance($("[data-lng='MSG.0000000372']").text(), {showtime:"LONG"}); // 신규 부품식별표 생성에 실패했습니다
                            return;
                        }
                        Box_No_List.push({"COPORATE_CD":cop,"PLANT_CD":$("#selPLANT").val(),"LOC_TP":$("#selLOCTP").val(), "BOX_NO":receivedData.resultBoxNo, "VENDOR_CD":vend, "PART_CD":part_cd, "OUT_QTY":div_qty, "REQ_ETC_NO":$("#txtORDR_NO").text(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});

                        console.log("resultBoxNo : "+receivedData.resultBoxNo);

                        $.each(Box_No_List,function(key,value){
                            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                            $.each(value,function(key,value){
                                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                            });
                        });

                        $("#list_ot_110 .tableCont").each(function() {
                            if($(this).find(".PART_CD").text() == part_cd){
                                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(div_qty));

                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                Tot_Scan_Qty += parseInt(div_qty);

                                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체 스캔 수량과 전체 불출 수량이 일치 할때
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔 수향이 불출 수량을 초과 할때(전체 수량)
                                    over_chk = true;
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                            }
                        });


                        C2_LIST.length = 0;
                        $("#inputScan").focus();
                    },
                    error: function(errorCode, errorMessage, settings) {
                        popupManager.instance($("[data-lng='MSG.0000000372']").text(), {showtime:"LONG"}); // 신규 부품식별표 생성에 실패했습니다
                        console.log("error");
                        C2_LIST.length = 0;
                        return;
                    }
                });


            }
        })



    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty == 0){
            popupManager.instance($("[data-lng='MSG.0000000347']").text(), {showtime:"LONG"}); // 지시수량이 0인 경우 불출 할 수 없습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty != Tot_Deli_Qty){
            popupManager.instance($("[data-lng='MSG.0000000296']").text(), {showtime:"LONG"}); // 스캔수량과 불출수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if((Tot_Scan_Qty == Tot_Deli_Qty) && (over_chk == true)) {
            popupManager.instance($("[data-lng='MSG.0000000296']").text(), {showtime:"LONG"}); // 스캔수량과 불출수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }
        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false) {
            save();
        }
    }

    // PR_PDA_OT_110_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_OT_110_C1.do',
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
                clear();
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_ot_110").html("");
        $("#txtORDR_NO").text("");
        $("#list_ot_110_head").addClass("blind");

        Box_No_List.length = 0;
        C2_LIST.length = 0;
        saveflag = false;
        over_chk = false;
        deli_flag = false;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");

        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
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