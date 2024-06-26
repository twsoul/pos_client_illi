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

    var lp_box_no = "";
    var lp_part_no = "";
    var lp_box_qty = "";
    var lp_box_lot_no = "";
    var lp_box_BoxSeq = "";
    var lp_box_Prt = "";
    var lp_box_vendcd = "";

    var PART_NM = "";
    var VENDOR_CD = "";
    var Box_No_List = [];
    var SCAN_FLAG = "Y";

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

        // 플랜트 변경 시 현창, 반, 공정 콤보박스 신규 호출
        $("#selPLANT").on("change", function() {
            StorageLocationReq();
            sel_Line_Set();
            ProcCodeReq();
        });

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 업체 변경 시 스캔 포커스
        $("#selVENDOR").on('change', function (e) {
            BoxNoScan($("#txtPART_CD").val());
        })

        // 라인 변경 시 스캔 포커스
        $("#selLINE").on('change', function (e) {
            $("#inputScan").focus();
        })

        // 공정정 변경 시 스 포커스
        $("#selPROC").on('change', function (e) {
            dataManager.storage("saveUserProc", $("#selPROC").val());
            $("#inputScan").focus();
        })

        // 스캔유무 선택 시
        $("input[name=\"radioSEL\"]").on("change", function() {
            if($(this).val() == "SCAN"){
                clear();
                $("#txtPART_CD").attr("readonly",true);
                SCAN_FLAG = "Y";
            }
            if($(this).val() == "MANUAL"){
                clear();
                $("#txtPART_CD").attr("readonly",false);
                $("#txtPART_CD").focus();
                SCAN_FLAG = "N";
            }
        });

        $(window).on('keydown', function (e) {
            if (e.key === 'Tab' || e.keyCode === 9) {
                e.preventDefault();
                var id = $(':focus').attr('id');
                console.log("id : "+id);

                $("#"+id).blur();
            }
        });

        $("#txtPART_CD").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var part_cd = $(this).val();
                manualEvent(part_cd);
            }
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on("click", function() {
            setSaveClickEvent();
        });

        // 초기화 버튼 클릭 시
        $("#btnInit").on("click", function() {
            setClearClickEvent();
            $("#inputScan").focus();
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
                    	tag += "<option value='" + rowData.VALUE + "' value1='" + rowData.LINE_CD_FLAG +"'>" + rowData.TEXT + "</option>";
                    });
                    $("#selPLANT").append(tag);
                    $("#selPLANT").val(getWERKS).prop("selected", true);
                    StorageLocationReq();
                    sel_Line_Set();
                    ProcCodeReq();
    		    }
    		}
    	});
    };

    // 원창, 현창 콤보박스 정보 조회
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

    // 라인 콤보 박스 정보 조회
    var sel_Line_Set = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/LineCodeList.do',
            data: {
                'PLANT_CD': $("#selPLANT").val(),
                'LINE_TYPE': "20",
                'LANG':getLNG,
                'event':'라인 정보 조회'
            },
            success: function(receivedData, setting) {
                var tag = "";
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                $("#selLINE").html("");
                if(receivedData.ListCount != 0){

                    $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.LINE_CD + "'>" + rowData.LINE_NM + "</option>";
                    });
                }
                $("#selLINE").append(tag);
            }
        });
        $("#inputScan").focus();
    }

    // 공정 콤보박스 정보 조회
    var ProcCodeReq = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/selectComboProcCode.do',
            data: {
                'LANG':getLNG,
                'COPORATE_CD': getCORP_CD
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selPROC").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.PROC_CD + "'>" + rowData.PROC_NM + "</option>";
                     });
                }
                $("#selPROC").append(tag);
                if (dataManager.storage('saveUserProc')) {
                	$("#selPROC").val(dataManager.storage('saveUserProc')).prop("selected", true);
                }
            }
        });
        $("#inputScan").focus();
    }

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);

        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            popupManager.instance($("[data-lng='MSG.0000000348']").text(), {showtime:"LONG"}); // 매뉴얼 선택 시 스캔 할 수 없습니다
            return;
        }
        if($("#selPLANT").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000118']").text(), {showtime:"LONG"}); // 플랜트를 먼저 선택하십시오
            return;
        }

        if(inputScan.length > 0) {
            barcodeProcessing(inputScan);
        }
    }

    // 업체 콤보박스 정보 조회
    var VendorReq = function(part_cd) {
        networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/ST_010_S1_TEMP1.do',
    		data: {
    		    'PLANT_CD': $("#selPLANT").val(),
    		    'PART_CD': part_cd,
            	'LANG': getLNG
            },
    		success: function(receivedData, setting) {
    		    $("#selVENDOR").html("");
    		    var tag = "";
    		    if(receivedData.ListCount == 0){
    		        popupManager.instance($("[data-lng='MSG.0000000494']").text(), {showtime:"LONG"}); // 현재 플랜트에 존재하는 품번이 아닙니다
    		        $("#selVENDOR").append(tag);
    		    }else{
                    $.each(receivedData.ListData, function(index,rowData){
                    	tag += "<option value='" + rowData.VENDOR_CD + "' value1='" + rowData.PART_NM +"'>" + rowData.VENDOR_NM + "</option>";
                    	console.log(rowData.VENDOR_CD + " : " +rowData.VENDOR_NM);
                    });
                    $("#txtPART_CD").val(part_cd);

                    $("#txtPART_CD").attr("readonly",true);
                    $("#selPLANT").attr("disabled",true);
                    $("#selVENDOR").append(tag);
                    console.log("lp_box_vendcd : "+lp_box_vendcd);
                    if(lp_box_vendcd!=""){
                        $("#selVENDOR").val(lp_box_vendcd).prop("selected", true);
                    }
                    BoxNoScan(part_cd);
    		    }
    		}
    	});
    };

    // 부품식별표 조회 함수
    var BoxNoScan = function(part_cd) {
        if($("#selLOCTP").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            return;
        }
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/ST_010_S1_TEMP2.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'PLANT_CD': $("#selPLANT option:selected").val(),
                'LOC_TP': $("#selLOCTP option:selected").val(),
                'PART_CD': part_cd,
                'VENDOR_CD':$("#selVENDOR option:selected").val(),
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                console.log("success");
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000494']").text(), {showtime:"LONG"}); // 현재 플랜트에 존재하는 품번이 아닙니다
                    $("#inputScan").focus();
                    return;
                }
                $("#ORG_BAR_QTY").val(rowData.ORG_BAR_QTY);
                $("#BAR_QTY").val(rowData.BAR_QTY);

                // 스캔 시 플랜트, 저장위치 선택 불가
                $("#selLOCTP").attr("disabled",true);


                $("#inputScan").focus();
            }
        });
    };

    var barcodeProcessing = function(barcode){
        var qrCode = new qrManager.QRcode(barcode);
        if(!qrManager.isValidBarcode(qrCode)){
            console.log("fail");
            return;
        }
        qrcode_callback(qrCode);

        console.log("PART_CD : "+lp_part_no);

        VendorReq(lp_part_no);
    }

    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtPART_CD").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($("#selVENDOR").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }
        if($("#selLINE").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000504']").text(), {showtime:"LONG"}); // 라인정보를 입력해야 저장이 가능합니다
            return;
        }

        if($("#selPROC").val() == ""){
            popupManager.instance($("[data-lng='MSG.0000000332']").text(), {showtime:"LONG"}); // 공정을 먼저 선택해 주십시오
            return;
        }
        var PART_NM = $("#selVENDOR option:selected").attr('value1').replace(/\[/g,"^&")
                                                                    .replace(/\]/g,"&^")
                                                                    .replace(/\,/g,"^*")
                                                                    .replace(/\=/g,"^%");
        Box_No_List.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "LINE_CD":$("#selLINE").val(), "SCAN_FLAG":SCAN_FLAG, "PART_CD":$("#txtPART_CD").val(), "PART_NM":PART_NM, "VENDOR_CD":$("#selVENDOR").val(), "VENDOR_NM":$("#selVENDOR option:selected").text(), "PROC_CD":$("#selPROC").val(), "IN_QTY":$("#ORG_BAR_QTY").val(), "WH_QTY":$("#BAR_QTY").val(), "LINE_QTY":$("#LINE_QTY").val(), "USE_QTY":$("#USE_QTY").val(), "SHORT_POINT":$("#SHORT_POINT").val(), "PLAN_SEQ":$("#PLAN_SEQ").val(), "TM_TYPE":$("#TM_TYPE").val(), "OVER_QTY":$("#OVER_QTY").val(), "TM_SEQ":$("#TM_SEQ").val(), "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});

        $.each(Box_No_List,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });
        save();
    }

    // PR_PDA_ST_010_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_ST_010_C1.do',
            data: {
                'param1': Box_No_List,
                'event':'결품시점 관리 저장'
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
                popupManager.instance($("[data-lng='MSG.0000000493']").text(), {showtime:"LONG"}); // 입력값을 확인해주십시오
                Box_No_List.length = 0;
                saveflag = false;
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    var clear = function(){
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        $("#selPROC").val("").prop("selected", true);

        $("#selVENDOR").html("");
        $("#txtPART_CD").val("");
        $("#ORG_BAR_QTY").val(0);
        $("#BAR_QTY").val(0);
        $("#LINE_QTY").val(0);
        $("#USE_QTY").val("");
        $("#TM_SEQ").val("");
        $("#TM_TYPE").val("");
        $("#PLAN_SEQ").val("");
        $("#OVER_QTY").val(0);
        $("#SHORT_POINT").val("");

        lp_box_no = "";
        lp_part_no = "";
        lp_box_qty = "";
        lp_box_lot_no = "";
        lp_box_BoxSeq = "";
        lp_box_Prt = "";
        lp_box_vendcd = "";

        PART_NM = "";
        VENDOR_CD = "";
        saveflag = false;
        Box_No_List.length = 0;

        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            $("#txtPART_CD").attr("readonly",false);
            $("#txtPART_CD").focus();
        }else{
            $("#inputScan").focus();
        }

    }

    var qrcode_callback = function(qrcode) {
        lp_box_no = qrcode.lp_Box_No();          // SCAN DATA BOX NO 추출
        lp_part_no = qrcode.lp_Box_PartNo();     // SCAN DATA PART_NO 추출
        lp_box_qty = qrcode.lp_Order_Qty();      // SCAN DATA BOX QTY 추출
        lp_box_lot_no = qrcode.lp_LotNo();       // SCAN DATA LOT_NO 추출
        lp_box_BoxSeq = qrcode.lp_BoxSeq();      // SCAN DATA Box Sequence 추출
        lp_box_Prt = qrcode.lp_Prt();            // SCAN DATA 출력 유형 추출
        lp_box_vendcd = qrcode.lp_Vendor();      // SCAN DATA VEND_CD 추출

        console.log("lp_box_no : "+ lp_box_no);
        console.log("lp_part_no : "+ lp_part_no);
        console.log("lp_box_qty : "+ lp_box_qty);
        console.log("lp_box_lot_no : "+ lp_box_lot_no);
        console.log("lp_box_BoxSeq : "+ lp_box_BoxSeq);
        console.log("lp_box_Prt : "+ lp_box_Prt);
        console.log("lp_box_vendcd : "+ lp_box_vendcd);
    }

    // 계산 함수
    var inputEvent = function(obj) {
        $(obj).val()

        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }
    };

    var manualEvent = function(part_cd){
        if($("input[name=\"radioSEL\"]:checked").val() == "MANUAL"){
            if(part_cd != ""){
                console.log("스캔됨");
                VendorReq(part_cd);
            }else{
                $("#txtPART_CD").click();
            }
        }
    }

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