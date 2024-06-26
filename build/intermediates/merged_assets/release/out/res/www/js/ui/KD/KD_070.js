/*******************************************************************
*	페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var getTEST = optionManager.getTEST();
    var saveUserCo = dataManager.storage('saveUserCo');

    var Box_No_Arr = [];
    var Box_No_List = [];

    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var WERKS = "";
    var LGORT = "";
    var KUNNR = "";
    var MEINS = "";
    var BUDAT = "";
    var COP_CD = "";

    var over_chk = false;
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
        if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
           screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        VendorReq();
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

        // 사급 변경 시 승인번호 콤보박스 신규 호출
        $("#selVENDOR").on('change', function (e) {
            clear();
            PrOutNoReq();
        })

        // 승인번호 변경 시 리스트 정보 재 조회
        $("#selPRNO").on('change', function (e) {
            clear();
            ListInfo();
        })

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
            $("#selPRNO").val("").prop("selected", true);
            setClearClickEvent();
        })
    };

    // 사급 콤보박스 정보 조회
    var VendorReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_070_S1.do',
            data: {
                'LANG': getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                $("#selVENDOR").html("");
                var tag = "";

                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"}); // 플랜트 조회 데이터가 없습니다
                }else{

                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.VENDOR_CD + "'>" + rowData.VENDOR_NM + "</option>";
                    });
                    $("#selVENDOR").append(tag);
                    PrOutNoReq();
                }
            }
        });
    };

    // 승인번호 콤보박스 정보 조회
    var PrOutNoReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_070_S2.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'VENDOR_CD': $("#selVENDOR option:selected").val()
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selPRNO").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.PR_OUT_NO + "'>" + rowData.PR_OUT_NO + "</option>";
                     });
                }
                $("#selPRNO").append(tag);
                ListInfo();
            }
        });
        $("#inputScan").focus();
    }

    // 승인번호 리스트 정보 조회 함수
    var ListInfo = function() {
        if($("#selPRNO").val() == ""){
            $("#inputScan").focus();
            return;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_070_S3.do',
            data: {
                'PR_OUT_NO': $("#selPRNO option:selected").val(),
                'event':'승인번호 리스트 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;
                var index = 0;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000386']").text(), {showtime:"LONG"}); // 승인번호가 존재하지 않거나 사용할 수 없는 승인번호 입니다
                    $("#selPRNO").val("").prop("selected", true);
                    $("#inputScan").focus();
                    return;
                }

                var tag = "";
                var template = $("#ListTemplate").html();

                $("#list_kd_070_head").removeClass("blind");

                $.each(receivedData.ListData, function(index,rowData){
                    index++;
                    tag += template.replace(/\{\{No\}\}/, index)
                                   .replace(/\{\{PR_OUT_NO\}\}/, rowData.PR_OUT_NO)
                                   .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                   .replace(/\{\{REQ_QTY\}\}/gi, rowData.REQ_QTY)
                                   .replace(/\{\{SCAN_QTY\}\}/, 0);
                    Tot_Deli_Qty += parseInt(rowData.REQ_QTY);
                });

                $("#list_kd_070").append(tag);
                $("#inputScan").focus();

            }
        });

    };

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        var userVendorCheck = $("#selVENDOR").val();
        var userPrNoCheck = $("#selPRNO").val();
        if(userVendorCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000387']").text(), {showtime:"LONG"}); // 사급을 먼저 선택하십시오
            return;
        }
        if(userPrNoCheck == ""){
            popupManager.instance($("[data-lng='MSG.0000000388']").text(), {showtime:"LONG"}); // 승인번호를 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            BoxNoScan(inputScan);
        }
    }

    // 스캔 시 부품식별표별 품번 조회
    var BoxNoScan = function(boxBarCode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectKDBoxNo.do',
            data: {
                'BOX_BAR_NO':boxBarCode,
                'LANG':getLNG,
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
                if (rowData.TRANS_TYPE == "MAAR") {
                    popupManager.instance($("[data-lng='MSG.0000000453']").text(), {showtime:"LONG"}); // 입하상태의 부품식별표입니다
                    $("#inputScan").focus();
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

                WERKS = rowData.PLANT_CD;
                LGORT = rowData.LOC_TP;
                MEINS = rowData.BASIC_UNIT;
                COP_CD = rowData.COPORATE_CD;

                $("#list_kd_070 .tableCont").each(function() {
                    if($(this).data("partcd") == rowData.PART_CD){
                        $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + parseInt(rowData.BAR_QTY));

                        if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".REQ_QTY").text())){
                            over_chk = true;
                        }
                        Tot_Scan_Qty += parseInt(rowData.BAR_QTY);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){
                            $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
                            over_chk = true;
                            $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                        }
                        exists = true;
                    }
                });
                if(!exists){
                    Box_No_Arr.pop();
                    popupManager.instance($("[data-lng='MSG.0000000389']").text(), {showtime:"LONG"}); // 리스트에 해당 부품식별표가 존재 하지 않습니다
                    $("#inputScan").focus();
                    return;
                }else{
                    Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD,"PLANT_CD":rowData.PLANT_CD,"LOC_TP":rowData.LOC_TP, "WH_CD":rowData.WH_CD == undefined ? "" : rowData.WH_CD, "BOX_NO":rowData.BOX_NO, "VENDOR_CD":rowData.VENDOR_CD, "PR_OUT_NO":$("#selPRNO").val(), "PART_CD":rowData.PART_CD, "BAR_QTY":rowData.BAR_QTY, "I_VBELN":"", "I_VBELN_VL":"", "USER_ID":getUSER_ID, "RTN_MSG":""});
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

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

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

    // 사외 창고 실사 저장
    var save = function() {
        var budatLIST = [];
        budatLIST.push({"COPORATE_CD":COP_CD, "PLANT_CD":WERKS, "RTN_MSG":"", "RTN_BUDAT":""});
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_070_C1.do',
            data: {
                'param1': budatLIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    console.log("resultBUDAT : "+ receivedData.resultBUDAT);
                    BUDAT = receivedData.resultBUDAT;

                    $.each(Box_No_List,function(key,value){
                        console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                        $.each(value,function(key,value){
                            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                        });
                    });

                    saveEAI();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000459']").text(), {showtime:"LONG"}); // 공장별 시작시간 조회에 실패했습니다
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                Box_No_List.length = 0;
            }
        });
    }

    var saveEAI = function(){
        var inspList = [];
        KUNNR = $("#selVENDOR option:selected").val();
        $("#list_kd_070 .tableCont").each(function() {
            var MATNR = $(this).find(".PART_CD").text();
            var MENGE = $(this).find(".REQ_QTY").text();
            inspList.push({"posnr":"","matnr":MATNR,"menge":MENGE,"meins":MEINS,"werks":WERKS,"lgort":LGORT});
        });
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/TLS_CreateSO.do',
            data: {
                'SERVER': getTEST,
                'kunnr':KUNNR,
                'budat':BUDAT,
                'tbody':inspList,
                'event':'KD유상사급 판매처리 데이터 수신'
            },
            success: function(receivedData, setting) {
                if(receivedData.TLS_CreateSOReturn == "S") {

                    $.each(Box_No_List,function(key){
                         Box_No_List[key]['I_VBELN'] = receivedData.TLS_CreateSOEV_VBELN;
                         Box_No_List[key]['I_VBELN_VL'] = receivedData.TLS_CreateSOEV_VBELN_VL;
                    });

                    save2();
                }else{
                    popupManager.alert(receivedData.TLS_CreateSOMsg, {
                        title: $("[data-lng='MSG.0000000004']").text(), // 알림
                        buttons:[$("[data-lng='MSG.0000000002']").text()] // 확인
                    }, function() {
                        PrOutNoReq();
                        clear();
                        $("#inputScan").focus();
                    });
                }
            }
        });

    }

    // 사외 창고 실사 저장
    var save2 = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_070_C2.do',
            data: {
                'param1': Box_No_List
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    VendorReq();
                    clear();
                    $("#inputScan").focus();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    VendorReq();
                    clear();
                    $("#inputScan").focus();
                }
            },
            error: function(errorCode, errorMessage, settings) {
                console.log("Save error");
                Box_No_List.length = 0;
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_070").html("");

        $("#list_kd_070_head").addClass("blind");

        Box_No_Arr.length = 0;
        Box_No_List.length = 0;

        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;

        WERKS = "";
        LGORT = "";
        KUNNR = "";
        MEINS = "";
        BUDAT = "";
        COP_CD = "";

        over_chk = false;

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        saveflag = false;
        $("#inputScan").focus();
    }

    var inputEvent = function(obj) {
        console.log("value : "+ $(obj).val() );
        $(obj).val()

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }
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
		setReloadEvent: setReloadEvent,
		inputEvent: inputEvent
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