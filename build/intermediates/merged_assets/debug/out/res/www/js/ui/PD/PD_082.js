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
    var saveflag = false;
    var CAR_NO = "";
    var DELI_DT = "";
    var DELI_CAR_SEQ = "";
    var ZONE_TO = "";
    var DELI_CAR_SEQ = "";
    var CUST_NO = "";
    var VENDOR_CD = "";

    var stack = 1;

    var C1_LIST = [];
    var C2_LIST = [];

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        // 이전 화면에서 전송한 데이터
        CAR_NO = dataManager.param("CAR_NO");
        DELI_DT = dataManager.param("DELI_DT");
        DELI_CAR_SEQ = dataManager.param("DELI_CAR_SEQ");
        ZONE_TO = dataManager.param("ZONE_TO");

        $("#txtCAR_NO").text(CAR_NO);

        // 사업장 콤보박스 Set
        CoporateCdReq();
        // 미회수 사유 콤보박스 Set
        notReturn();
        // 리스트 정보 Set
        ListSet();
	};



	// 이벤트 초기화
	var setInitEvent = function() {
        // 팔레트 추가 버튼 클릭 시
        $("#palletplsbtn").on('click', function (e) {
            if($("#selCOP").val() == ""){
                popupManager.instance($("[data-lng='MSG.0000000409']").text(), {showtime:"LONG"}); // 사업장을 먼저 선택하십시오
                return;
            } else {
                $("#selRTN").attr("disabled",true);
                $("#selRTN").val("").prop("selected", true);
                addPalletList();
            }
        })

        // 팔레트 제거 버튼 클릭 시
        $("#palletminusbtn").on('click', function (e) {
             removePalletList();
             if(stack<=1){
                $("#selRTN").attr("disabled",false);
                $("#selRTN").val("").prop("selected", true);
             }
        })

        // 사업장 콤보박스 변경 시
    	$("#selCOP").on('change', function (e) {
    	    clear();
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

    // 팔레트 추가 처리 함수
    var addPalletList = function(){


        // 팔레트 콤보박스 리스트 조회
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PD_082_S3.do',
        	data: {
            	'COPORATE_CD': $("#selCOP").val()
            },
        	success: function(receivedData, setting) {
        	    var tag = "";
        	    var pallet = "";
                var template = $("#PalletTemplate").html();

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000359']").text(), {showtime:"LONG"}); // 팔레트 정보가 존재하지 않습니다
                    $("#selRTN").attr("disabled",false);
                    $("#selRTN").val("").prop("selected", true);
                    return;
                }

                pallet += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        pallet += "<option value='" + rowData.PLT_CD + "'>" + rowData.PLT_NM + "</option>";
                     });
                }
                tag += template.replace(/\{\{STACK\}\}/, stack)
                               .replace(/\{\{item\}\}/, pallet);

                $("#pallet_pd_082").append(tag);
                stack++;
        	}
        });
    }

    // 팔레트 제거 처리 함수
    var removePalletList = function(){
        console.log("pre - stack : "+stack);

        if(stack<=1){
            return;
        }
        $("#pallet_pd_082 .table_area").each(function() {
            if($(this).data("stack") == stack-1){
                $(this).remove();
                stack--;
            }
        });
    }

    // 리스트 Set 함수
    var ListSet = function() {
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_082_S1.do',
            data: {
                'DELI_CAR_SEQ': DELI_CAR_SEQ,
                'LANG':getLNG
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                var box_no_exists = false;

                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000408']").text(), {showtime:"LONG"}); // 리스트가 존재하지 않습니다
                    return;
                }

                // 상차일정, 하차일정, 장소 Set
                $("#txtFR_DATE").text(rowData.ZONE_FR_DATE);
                $("#txtTO_DATE").text(rowData.ZONE_TO_DATE);
                $("#txtFR_ZONE").text(rowData.ZONE_FR);
                $("#txtTO_ZONE").text(rowData.ZONE_TO);

                $("#list_pd_082_head").removeClass("blind");
                DELI_CAR_SEQ = rowData.DELI_CAR_SEQ;
                CUST_NO = rowData.CUST_NO;
                VENDOR_CD = rowData.VENDOR_CD;

                $.each(receivedData.ListData, function(index,rowData){
                    var exists = false;
                    var tag = "";
                    var template = $("#ListTemplate").html();

                    $("#list_pd_082 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                            $(this).find(".MOVE_QTY").text(Number($(this).find(".MOVE_QTY").text()) + Number(rowData.MOVE_QTY));
                            exists = true;
                        }
                    });
                    if(!exists){
                        tag += template.replace(/\{\{CUST_NO\}\}/, rowData.CUST_NO)
                                       .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                       .replace(/\{\{DELI_CAR_SEQ\}\}/, rowData.DELI_CAR_SEQ)
                                       .replace(/\{\{MOVE_NO\}\}/, rowData.MOVE_NO)
                                       .replace(/\{\{ZONE_FR_DATE\}\}/, rowData.ZONE_FR_DATE)
                                       .replace(/\{\{ZONE_FR\}\}/, rowData.ZONE_FR)
                                       .replace(/\{\{ZONE_TO_DATE\}\}/, rowData.ZONE_TO_DATE)
                                       .replace(/\{\{ZONE_TO\}\}/, rowData.ZONE_TO)
                                       .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                       .replace(/\{\{PART_NM\}\}/gi, rowData.PART_NM)
                                       .replace(/\{\{PLT_CD\}\}/gi, rowData.PLT_CD)
                                       .replace(/\{\{PLT_IN_QTY\}\}/gi, rowData.PLT_IN_QTY)
                                       .replace(/\{\{MOVE_QTY\}\}/gi, rowData.MOVE_QTY);
                        $("#list_pd_082").append(tag);
                    }
                    $("#txtTOT_cnt").text(Number($("#txtTOT_cnt").text()) + Number(rowData.MOVE_QTY));
                });
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        var save_flag = true;
        var PLT_CD = [];

        $("#list_pd_082 .tableCont").each(function() {
            var moveqty = Number($(this).find(".MOVE_QTY").text());
            while(moveqty - Number($(this).data("pltinqty")) > 0){
                C1_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":getWERKS, "CUST_NO":$(this).data("custno"), "VENDOR_CD":$(this).data("vendorcd"), "PLT_CD":$(this).data("pltcd"), "PLT_QTY":$(this).data("pltinqty"), "PART_CD":$(this).data("partcd"), "PART_QTY":$(this).find(".MOVE_QTY").text(), "DELI_NO_FLAG":$("#selYN").val(), "DELI_CAR_SEQ":$(this).data("delicarseq"), "USER_ID":getUSER_ID, "RTN_MSG":""});
                moveqty -= Number($(this).data("pltinqty"));
            }
            C1_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":getWERKS, "CUST_NO":$(this).data("custno"), "VENDOR_CD":$(this).data("vendorcd"), "PLT_CD":$(this).data("pltcd"), "PLT_QTY":moveqty, "PART_CD":$(this).data("partcd"), "PART_QTY":$(this).find(".MOVE_QTY").text(), "DELI_NO_FLAG":$("#selYN").val(), "DELI_CAR_SEQ":$(this).data("delicarseq"), "USER_ID":getUSER_ID, "RTN_MSG":""});
        });

        if(stack<=1){
            if($("#selRTN").val() == ""){
                popupManager.instance($("[data-lng='MSG.0000000413']").text(), {showtime:"LONG"}); // 미회수 사유를 선택하십시오
                C1_LIST.length = 0;
                return;
            }else if($("#selCOP").val() == ""){
                popupManager.instance($("[data-lng='MSG.0000000409']").text(), {showtime:"LONG"}); // 사업장을 먼저 선택하십시오
                C1_LIST.length = 0;
                return;
            }else{
                C2_LIST.push({"COPORATE_CD":getCORP_CD,"PLANT_CD":getWERKS, "L_COPORATE_CD":$("#selCOP").val(), "CUST_NO":CUST_NO, "VENDOR_CD":VENDOR_CD, "DELI_NO_FLAG":$("#selYN").val(), "PLT_CD":"", "PLT_QTY":0, "PLT_REC_CD":$("#selRTN").val(), "DELI_CAR_SEQ":DELI_CAR_SEQ, "USER_ID":getUSER_ID, "RTN_MSG":""});
            }
        }

        $("#pallet_pd_082 .table_area").each(function() {
            var bar_exists = false;
            var selPLT = $(this).find(".selPALLET").val();

            if($(this).find(".PLT_QTY").val()<=0){
                popupManager.instance($("[data-lng='MSG.0000000410']").text(), {showtime:"LONG"}); // 팔레트 개수가 0개 이하입니다
                save_flag = false;
                return;
            }
            if($(this).find(".selPALLET").val() == ""){
                popupManager.instance($("[data-lng='MSG.0000000411']").text(), {showtime:"LONG"}); // 선택되지 않은 팔레트가 존재합니다
                save_flag = false;
                return;
            }

            PLT_CD.forEach(function(arr){
                if(selPLT == arr){
                    bar_exists = true;
                }
            });
            if(!bar_exists){
                PLT_CD.push(selPLT);
                C2_LIST.push({"COPORATE_CD":getCORP_CD, "PLANT_CD":getWERKS, "L_COPORATE_CD":$("#selCOP").val(), "CUST_NO":CUST_NO, "VENDOR_CD":VENDOR_CD, "DELI_NO_FLAG":$("#selYN").val(), "PLT_CD":$(this).find(".selPALLET").val(), "PLT_QTY":$(this).find(".PLT_QTY").val(), "PLT_REC_CD":$("#selRTN").val(), "DELI_CAR_SEQ":DELI_CAR_SEQ, "USER_ID":getUSER_ID, "RTN_MSG":""});
            } else {
                popupManager.instance($("[data-lng='MSG.0000000412']").text(), {showtime:"LONG"}); // 중복된 팔레트가 존재합니다
                save_flag = false;
                return;
            }
        });

        if(save_flag){
            console.log("save ok");
            $.each(C1_LIST,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                $.each(value,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                });
            });
            $.each(C2_LIST,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                $.each(value,function(key,value){
                    console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
                });
            });
            save();
        } else {
            C1_LIST.length = 0;
            C2_LIST.length = 0;
            console.log("save no");
        }


    }

    // 출고 지시 저장
    var save = function(){
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_082_C1.do',
            data: {
                'param1': C1_LIST,
                'param2': C2_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result == "S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                    moveToBack();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                    clear();
                    moveToBack();
                }
            },
             error: function(errorCode, errorMessage, settings) {
                 popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
                 saveflag = false;
                 console.log("Save error");
                 C1_LIST.length = 0;
                 C2_LIST.length = 0;
             }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function(){
        $("#pallet_pd_082").html("");
        stack = 1;
        C1_LIST.length = 0;
        C2_LIST.length = 0;
        $("#selRTN").attr("disabled",false);
        $("#selRTN").val("").prop("selected", true);
        saveflag = false;
    }

    // 사업장 콤보박스
    var CoporateCdReq = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_082_S2.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'LANG': getLNG
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selCOP").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                     });
                }
                $("#selCOP").append(tag);
            }
        });
    }

    // 미회수 사유 콤보박스
    var notReturn = function(){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PD_082_S4.do',
            data: {
                'COPORATE_CD': getCORP_CD,
                'LANG': getLNG
            },
            success: function(receivedData, setting) {
                var tag = "";
                $("#selRTN").html("");
                tag += "<option value=''>"+$("[data-lng='LB.0000000119']").text()+"</option>"; // 선택
                if(receivedData.ListCount != 0){
                     $.each(receivedData.ListData, function(index,rowData){
                        tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                     });
                }
                $("#selRTN").append(tag);
            }
        });
    }

    var inputEvent = function(obj) {
        if($(obj).val() == ""){
            $(obj).val(0);
            $(obj).click();
        }
    };

	var moveToBack = function() {
		screenManager.moveToBack();
	};

	// Public Method
	return {
		setInitScreen: setInitScreen,
		setInitEvent: setInitEvent,
		moveToBack: moveToBack,
		inputEvent:inputEvent
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