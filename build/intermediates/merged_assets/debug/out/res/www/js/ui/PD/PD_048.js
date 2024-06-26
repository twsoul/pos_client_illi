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

    var Bar_No_List = [];
    var scanflag = false;

    var over_chk = false;
    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var scanPartCd = "";
    var scanBarNo = "";
    var scanTag = "";
    var scanBarQty = 0;
    var move_seq = 1;
    var scanCnt = 0;
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }
        PlantReq();
	};

    var screenScan = function() {
        M.plugin('qr').open(function(rst) {
            if (rst.status == 'SUCCESS') {
                var qr_data = rst.result;
                //console.log(qr_data);
                var e = jQuery.Event( "keypress", { keyCode: 13 } );
                $("#inputScan1").val(qr_data);
                $("#inputScan1").focus();
                $("#inputScan1").trigger(e);
            } else {
            }
        }, {
                'cancel' : '이전',
                'custom' : '',
                'customHtml' : '',
                'flashOn' : 'Flash ON',
                'flashOff' : 'Flash OFF',
                'menuAnimation' : 'ON', // ON, OFF
        });
    };

	// 이벤트 초기화
	var setInitEvent = function() {
        $("#inputScan1").on('keypress', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var inputScan = $(this).val();
                $(this).val("");
                $(this).blur();
                if(inputScan != ""){
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan1").focus();
                }
            }
        });

        $("#btnScan1").on("click", screenScan);

        // 팝업 호출 후 스캔 버튼 클릭 시
        $(window).on('keydown', function (e) {
            if(model == "CT40"){
                if(scanflag == true){
                    if(e.keyCode === 0){
                        $("#inputScan2").focus();
                    }
                } else {
                    if(e.keyCode === 0){
                        $("#inputScan1").focus();
                    }
                }
            }
        });

        $("#inputScan1").unbind("focus").on("focus", function(event) {
            var id = $(this).attr("id");

            $(this).attr("readonly",true);
            setTimeout(function() {
                $("#"+id).attr("readonly",false);
            },10)
        })

        $("#inputScan1").on("click", function(event) {
            var id = $(this).attr("id");

            $(this).attr("readonly",true);
            setTimeout(function() {
                $("#"+id).attr("readonly",false);
            },10)
        })

        // 플랜트 변경 시 저장위치 콤보박스 신규 호출
        $("#selPLANT").on('change', function() {
            StorageLocationReq();
        })

        // 저장위치 변경 시 스캔 포커스
        $("#selLOCTP").on('change', function (e) {
            $("#inputScan1").focus();
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
        $("#inputScan1").focus();
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
            }else{
                BoxNoInfo(inputScan);
            }
        }
    }

    // 반출번호 정보 조회 함수
    var OtOrder = function(move_no){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_048_S1.do',
            data: {
                'MOVE_NO':move_no,
                'LANG':getLNG,
                'event':'반출번호 정보 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                    $("#inputScan1").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()){
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan1").focus();
                    return;
                }
                if (rowData.MOVE_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000288']").text(), {showtime:"LONG"}); // 이미 반출된 반출번호입니다
                    $("#inputScan1").focus();
                    return;
                }
                // 스캔 후 플랜트, 저장위치, 반출증/유무, 반출유형 선택 불가
                $("#selLOCTP").attr("disabled",true);
                $("#selPLANT").attr("disabled",true);

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_pd_048_head").removeClass("blind");
                    tag += template.replace(/\{\{MOVE_SEQ\}\}/gi, rowData.MOVE_SEQ)
                                   .replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                   .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                   .replace(/\{\{MOVE_NO\}\}/, rowData.MOVE_NO)
                                   .replace(/\{\{MOVE_TYPE\}\}/, rowData.MOVE_TYPE)
                                   .replace(/\{\{MOVE_GB\}\}/, rowData.MOVE_GB)
                                   .replace(/\{\{MOVE_DESC\}\}/, rowData.MOVE_DESC)
                                   .replace(/\{\{MOVE_SEQ\}\}/, rowData.MOVE_SEQ)
                                   .replace(/\{\{PART_CD\}\}/, rowData.PART_CD)
                                   .replace(/\{\{MOVE_QTY\}\}/gi, rowData.MOVE_QTY)
                                   .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                   .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                   .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY);
                   $("#list_pd_048").append(tag);
                   $("#txtORDR_NO").text(rowData.MOVE_NO);
                   // 전체 스캔 수량
                   Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);
                   $("#inputScan1").focus();
                });
            }
        });
    };

    // 레일 조회 함수
    var BoxNoInfo = function(boxBarCode){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_048_S2.do',
            data: {
                'PLANT_CD':$("#selPLANT").val(),
                'LOC_TP':$("#selLOCTP").val(),
                'BOX_BAR_NO':boxBarCode,
                'event':'레일 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var bar_exists = false;
                var part_cd_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan1").focus();
                    return;
                }
                if(rowData.PLANT_CD != $("#selPLANT").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000297']").text(), {showtime:"LONG"}); // 타 공장 바코드입니다
                    $("#inputScan1").focus();
                    return;
                }
                if(rowData.LOC_TP != $("#selLOCTP").val()) {
                    popupManager.instance($("[data-lng='MSG.0000000302']").text(), {showtime:"LONG"}); // 타 저장위치 바코드 입니다
                    $("#inputScan1").focus();
                    return;
                }
                $("#list_pd_048 .tableCont").each(function() {
                    if($(this).find(".PART_CD").text() == rowData.PART_CD){
                        part_cd_exists = true;
                    }
                });
                if(!part_cd_exists){
                    popupManager.instance($("[data-lng='MSG.0000000290']").text(), {showtime:"LONG"}); // 반출목록에 해당 품번이 존재하지 않습니다
                    $("#inputScan1").focus();
                    return;
                }
                if(Bar_No_List.some(Bar_No_List => Bar_No_List.BAR_NO === rowData.BAR_NO)){
                    popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
                    $("#inputScan").focus();
                    return;
                }
                // 스캔 데이터 초기화
                scanTag = "";
                scanPartCd = "";
                scanBarNo = "";
                scanBarQty = 0;

                scanPartCd = rowData.PART_CD;
                scanBarNo = rowData.BAR_NO;
                scanBarQty = Number(rowData.PACK_QTY);
                var template = $("#ListTemplate").html();

                // 각인품 스캔 팝업 호출
                ScanPopup();
            }
        });
    }

    // 각인품 조회 함수
    var PartCdScan = function(boxBarCode){
        //바코드 예시
        //[)>06VEEKSP88651DW510ASET21K171577/4.27AMC
        //[)>06VEEKSP88651DW510ASET21K171577/4.27AMC
        //[)>P88651DW510B211111P1412A0.00O
        //   [)>P88651DW510B211111P1412A0.00O
        console.log("NprocessBar : "+boxBarCode);
        var processBar = boxBarCode.replace("","").replace("","");
        console.log("PartCdScan");
        console.log("processBar : "+processBar);
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_048_S3.do',
            data: {
                'BOX_BAR_NO':processBar,
                'event':'각인품 조회'
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000370']").text(), {showtime:"LONG"}); // 존재하지 않는 각인품 바코드 입니다
                    $("#inputScan1").focus();
                    return;
                }

                console.log("scanPartCd : "+scanPartCd);
                console.log("rowData.PART_CD : "+rowData.PART_CD);

                if(scanPartCd == rowData.PART_CD){
                    scanCnt++;
                    if(scanCnt == 3){
                        popupManager.instance(scanCnt+" / 3", {showtime:"LONG"});
                        $("#list_pd_048 .tableCont").each(function() {
                            console.log("List PART_CD : " + $(this).find(".PART_CD").text());
                            console.log("PART_CD : " + rowData.PART_CD);
                            if($(this).find(".PART_CD").text() == rowData.PART_CD){
                                $(this).find(".SCAN_QTY").text(parseInt($(this).find(".SCAN_QTY").text()) + scanBarQty);
                                console.log("SCAN_QTY : " + $(this).find(".SCAN_QTY").text());

                                // 스캔한 수량이 불출할 수량 보다 많을 경우 과납 플래그(품번기준 수량)
                                if(parseInt($(this).find(".SCAN_QTY").text()) > parseInt($(this).find(".MOVE_QTY").text())){
                                    over_chk = true;
                                }

                                $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                                Tot_Scan_Qty += scanBarQty;
                                move_seq = $(this).find(".MOVE_SEQ").text();
                                console.log("Tot_Scan_Qty : " + Tot_Scan_Qty);

                                if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false){ // 전체스캔수량과 전체지시수량이 일치 할때
                                    $("#inpBoxQty").removeAttr('class').addClass("nBluebox1");
                                } else if (Tot_Scan_Qty > Tot_Deli_Qty) { // 스캔수량이 지시수량을 초과 할때(전체 수량)
                                    over_chk = true;
                                    $("#inpBoxQty").removeAttr('class').addClass("nRedbox1");
                                }
                                part_cd_exists = true;
                            }
                        });
                        Bar_No_List.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":$("#selPLANT").val(), "LOC_TP":$("#selLOCTP").val(), "MOVE_SEQ":move_seq, "MOVE_NO":$("#txtORDR_NO").text(), "MOVE_QTY":scanBarQty, "BAR_NO":scanBarNo, "CHK_SERIAL_NO":rowData.LOT_NO, "USER_ID":getUSER_ID, "RTN_MSG":""});
                        scanCnt = 0;
                        $("#inputScan1").focus();
                    }else{
                        popupManager.instance(scanCnt+" / 3", {showtime:"LONG"});
                        ScanPopup();
                    }
                } else {
                    popupManager.instance($("[data-lng='MSG.0000000371']").text(), {showtime:"LONG"}); // 품번이 다릅니다
                    scanCnt = 0;
                    $("#inputScan1").focus();
                    return;
                }
            },
            error: function(errorCode, errorMessage, settings) {
                scanCnt = 0;
                $("#inputScan1").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#inpBoxQty").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan1").focus();
            return;
        }
        if(Tot_Scan_Qty != Tot_Deli_Qty){
            popupManager.instance($("[data-lng='MSG.0000000292']").text(), {showtime:"LONG"}); // 스캔수량과 지시수량이 일치하지 않습니다
            $("#inputScan1").focus();
            return;
        }
        if((Tot_Scan_Qty == Tot_Deli_Qty) && (over_chk == true)) {
            popupManager.instance($("[data-lng='MSG.0000000292']").text(), {showtime:"LONG"}); // 스캔수량과 지시수량이 일치하지 않습니다
            $("#inputScan1").focus();
            return;
        }
        if(Tot_Scan_Qty == Tot_Deli_Qty && over_chk == false) {

            $.each(Bar_No_List,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                $.each(value,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                });
            });

            save();
        }
    }

    // PR_PDA_PD_045_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_048_C1.do',
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

        $("#list_pd_048").html("");
        $("#txtORDR_NO").text("");
        $("#list_pd_048_head").addClass("blind");

        Bar_No_List.length = 0;

        over_chk = false;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;

        scanPartCd = "";
        scanBarNo = "";
        scanBarQty = 0;
        move_seq = 1;
        scanCnt = 0;

        $("#inpBoxQty").text("0").removeAttr('class').addClass("nRedbox1");
        $("#selPLANT").attr("disabled",false);
        $("#selLOCTP").attr("disabled",false);
        saveflag = false;
        $("#inputScan1").focus();
    }

    // 스캔 팝업 함수(각인품 스캔)
    var ScanPopup = function(){
        scanflag = true;

        objScanInput = new ScanBarPopup({ title:$("[data-lng='LB.0000000369']").text(), id: "popScan", label:$("[data-lng='LB.0000000126']").text(),value:"", goBottom: true, submitCallback: function(val){
            if(val == "cancel") {
                scanflag =false;
                scanCnt = 0;
                $("#inputScan1").focus();
            }else{
                scanflag =false;
                console.log("val : "+ val);
                PartCdScan(val);
                $("#inputScan1").focus();
            }


        }});
        objScanInput.init();
        objScanInput.show();
        $("#popScan input").focus();
        $("#inputScan2").focus();
    }

    // BOX_NO이 리스트에 존재하는지 확인하는 함수
    var IsNotExitList = function(box_no){
        var rtn = false;
        $("#list_pd_048 .tableCont").each(function() {
            if($(this).data("boxno") == box_no){
                rtn = true;
                return false; // each 문의 break;
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