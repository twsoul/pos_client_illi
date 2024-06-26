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

    var Box_No_List = [];
    var barcode = "";

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        DeliCaseReq();
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
    };

    // 용도변경 콤보박스 정보 조회
    var DeliCaseReq = function() {
        networkManager.httpSend({
    	    server: saveUserCo,
    		path: 'api/ST_080_S2.do',
    		data: {
            	'LANG': getLNG,
            	'COPORATE_CD': getCORP_CD
            },
    		success: function(receivedData, setting) {
    		    $("#selCHG").html("");
    		    if(receivedData.ListCount == 0){
    		        popupManager.instance($("[data-lng='MSG.0000000010']").text(), {showtime:"LONG"});
    		    }else{
    		        var tag = "";
                    $.each(receivedData.ListData, function(index,rowData){
                    	tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                    $("#selCHG").append(tag);
    		    }
    		}
    	});
    };

    // 스캔 시 처리 로직
    var ScanValidation = function(inputScan) {
        inputScan = upperManager.Upper(inputScan);
        var userPlantCheck = $("#selPLANT").val();

        if(inputScan.length > 0) {
            clear();
            BoxNoScan(inputScan);
        }
    }

    // 부품식별표 조회 함수
    var BoxNoScan = function(box_barcode) {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/ST_080_S1.do',
            data: {
                'BOX_BAR_NO': box_barcode,
                'LANG':getLNG,
                'event':'부품식별표 조회'
            },
            success: function(receivedData, setting) {
                console.log("success");
                var rowData = receivedData.ListData[0];
                var bar_qty = 0;
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000270']").text(), {showtime:"LONG"}); // 부품식별표가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                bar_qty = Number(rowData.BAR_QTY);
                $("#selCHG").val(rowData.DELI_CASE).prop("selected", true);
                if(bar_qty <= 0){
                    $("#txtBAR_QTY").addClass("nRedbox1");
                    $("#selCHG").attr("disabled",true);
                }
                if(rowData.HOLD_FLAG == "Y" || rowData.TRANS_TYPE == "MAAR"){
                    $("#selCHG").attr("disabled",true);
                }

                barcode = box_barcode;
                $("#txtBOX_NO").text(rowData.BOX_NO);

                $("#txtTOTAL_QTY").text(rowData.TOTAL_QTY);
                $("#txtTOTAL_BOX_QTY").text(rowData.TOTAL_BOX_QTY);
                $("#txtBAR_QTY").text(rowData.BAR_QTY);

                $("#txtPART_CD").text(rowData.PART_CD);
                $("#txtLOT").text(rowData.LOT_NO);

                $("#txtPART_NM").text(rowData.PART_NM);

                $("#txtVENDOR_NM").text(rowData.VENDOR_NM);
                $("#txtDELI_GB").text(rowData.DELI_GB);

                $("#txtHOLD_FLAG").text(rowData.HOLD_FLAG);
                $("#txtINSP_FLAG").text(rowData.INSP_FLAG);
                $("#txtDKIND").text(rowData.DKIND);
                $("#txtSEL_FLAG").text(rowData.SEL_FLAG);

                $("#txtPLANT_CD").text(rowData.PLANT_NM);
                $("#txtLOC_TP").text(rowData.LOC_NM);

                $("#txtTRANS_TYPE").text(rowData.TRANS_TYPE_NM);
                $("#txtTRANS_KEY").text(rowData.TRANS_KEY);

                $("#txtPRE_INSP_DTTM").text(rowData.PRE_INSP_DTTM);

                Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD, "PLANT_CD":rowData.PLANT_CD, "BOX_NO":rowData.BOX_NO, "DELI_CASE":"", "USER_ID":getUSER_ID, "USER_NM":getUSER_NM, "RTN_MSG":""});

                $("#inputScan").focus();
            }
        });

    };



    // PR_PDA_ST_010_C1 호출 및 저장
    var save = function() {
        console.log("save");

        if($("#txtBOX_NO").text()== ""){
            return;
        } else {
            $.each(Box_No_List,function(key){
                 Box_No_List[key]['DELI_CASE'] = $("#selCHG").val();
            });
            networkManager.httpSend({
                server: saveUserCo,
                path: 'api/PR_PDA_ST_080_C1.do',
                data: {
                    'param1': Box_No_List
                },
                success: function(receivedData, setting) {
                    if(receivedData.result=="S"){
                        popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                        clear();
                        BoxNoScan(barcode);
                    }else{
                        popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                        clear();
                    }
                },
                error: function(errorCode, errorMessage, settings) {
                    console.log("Save error");
                    Box_No_List.length = 0;
                }
            });
        }
    }

    var setClearClickEvent = function(){
        clear();
    };

    var clear = function(){
        $("#txtBOX_NO").text("");
        $("#txtBAR_QTY").text("");

        $("#txtPART_CD").text("");
        $("#txtLOT").text("");

        $("#txtPART_NM").text("");

        $("#txtVENDOR_NM").text("");
        $("#txtDELI_GB").text("");

        $("#txtHOLD_FLAG").text("");
        $("#txtINSP_FLAG").text("");
        $("#txtDKIND").text("");
        $("#txtSEL_FLAG").text("");

        $("#txtPLANT_CD").text("");
        $("#txtLOC_TP").text("");

        $("#txtTRANS_TYPE").text("");
        $("#txtTRANS_KEY").text("");

        $("#txtPRE_INSP_DTTM").text("");
        $("#selCHG").attr("disabled",false);
        $("#txtBAR_QTY").removeClass("nRedbox1");
        Box_No_List.length = 0;

        $("#inputScan").focus();
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
		save: save
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