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

    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var Box_No_List = [];

    var over_chk = false; // 품번 기준 과납 여부 플래그
    var deli_flag = false; // 요청번호가 스캔 되었는지 체크하는 플래그

    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

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
                    console.log(inputScan);
                    ScanValidation(inputScan);
                }else{
                    $("#inputScan").focus();
                }
            }
        });

        // 저장 버튼 클릭 시
        $("#btnSave").on('click', function (e) {
            setSaveClickEvent();
        })

        // 초기화 버튼 클릭 시
        $("#btnInit").on('click', function (e) {
            setClearClickEvent();
        })
	};

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        var deli_no = "";
        if(inputScan.length > 0) {
            if($("#txtORDR_NO").text() == "") { // 스캔된 납입카드번호가 없을 경우
                if(!head_tail_chk(inputScan)){
                    deli_no = inputScan;
                }else{
                    deli_no = deliNoProcessing(inputScan);
                }

                OrderInfo(deli_no);
            } else {
                popupManager.instance($("[data-lng='MSG.0000000457']").text(), {showtime:"LONG"}); // 이미 납입카드를 스캔하셨습니다
                $("#inputScan").focus();
                return;
            }
        }
    }

    // 바코드 DELI_NO 추출 함수
    var deliNoProcessing = function(deli_bar_no){ // 바코드 예시 - [)>*06:DND004QKB00006:P45242-4C000:5Q100:D211102:6E00006:2R03:VD004:EOT
        var myResult = /:DN.{2,}/g.exec(deli_bar_no);
        console.log(deli_bar_no);
        if (myResult!=null){
            var box_no = myResult[0].substr(3,myResult[0].length-1);
            console.log(box_no.substr(0,box_no.indexOf(":")));
            return box_no.substr(0,box_no.indexOf(":"));
        }else{
            console.log("잘못된 DELI_NO 바코드");
            return "";
        }
    }

    var head_tail_chk = function(deli_bar_no){
        var head,tail;
        console.log(deli_bar_no);
        head = deli_bar_no.substr(0,4);
        console.log(head);
        tail = deli_bar_no.substr(deli_bar_no.length-4,4);
        console.log(tail);
        if ( (head=="[)>*") && (tail=="*EOT") )
            return true;
        else
            return false;
    }

    // 납입카드번호 조회 하는 함수
    var OrderInfo = function(orderNo){
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/KD_060_S1.do',
            data: {
                'DELI_BAR_NO':orderNo,
                'LANG':getLNG
            },
            success: function(receivedData, setting) {
                var rowData = receivedData.ListData[0];
                if(receivedData.ListCount == 0){
                    popupManager.instance($("[data-lng='MSG.0000000129']").text(), {showtime:"LONG"}); // 납입카드 번호가 존재하지 않습니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.IN_YN == "Y") {
                    popupManager.instance($("[data-lng='MSG.0000000273']").text(), {showtime:"LONG"}); // 이미 납입된 납입카드 번호입니다
                    $("#inputScan").focus();
                    return;
                }
                if (rowData.PACK_FLAG == "N") {
                    popupManager.instance(rowData.DELI_NO+" "+$("[data-lng='MSG.0000000501']").text(), {showtime:"LONG"}); // 는 배차되지 않은 납입카드입니다. 카드 번호를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }
                if(rowData.DELI_ST != "10" && rowData.DELI_ST != "20"){
                    popupManager.instance(rowData.DELI_NO+" "+$("[data-lng='MSG.0000000385']").text(), {showtime:"LONG"}); // 는 이미 출고된 납입카드입니다. 카드 번호를 확인 바랍니다
                    $("#inputScan").focus();
                    return;
                }

                $("#txtORDR_NO").text(rowData.DELI_NO);

                $.each(receivedData.ListData, function(index,rowData){
                    var tag = "";
                    var template = $("#ListTemplate").html();
                    var exists = false;
                    $("#list_kd_060 .tableCont").each(function() {
                        if($(this).find(".PART_CD").text() == rowData.PART_CD){ // 품번이 같은 부품식별표 개수 추가
                            $(this).find(".BAR_QTY").text(parseInt($(this).find(".BAR_QTY").text()) + parseInt(rowData.BAR_QTY));
                            $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                            exists = true;
                        }
                    });
                    if(!exists){
                        $("#list_kd_060_head").removeClass("blind");
                        tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                       .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                       .replace(/\{\{DELI_NO\}\}/, rowData.DELI_NO)
                                       .replace(/\{\{DELI_TYPE\}\}/, rowData.DELI_TYPE)
                                       .replace(/\{\{DELI_CASE\}\}/, rowData.DELI_CASE)
                                       .replace(/\{\{DELI_ST\}\}/, rowData.DELI_ST)
                                       .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                       .replace(/\{\{DELI_QTY\}\}/gi, rowData.DELI_QTY)
                                       .replace(/\{\{BOX_QTY\}\}/gi, rowData.BOX_QTY)
                                       .replace(/\{\{BOX_NO\}\}/gi, rowData.BOX_NO)
                                       .replace(/\{\{BAR_QTY\}\}/gi, rowData.BAR_QTY)
                                       .replace(/\{\{VENDOR_CD\}\}/gi, rowData.VENDOR_CD)
                                       .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY)
                                       .replace(/\{\{IN_YN\}\}/, rowData.IN_YN);
                        $("#inpBoxQty").text(parseInt($("#inpBoxQty").text())+1);
                        $("#list_kd_060").append(tag);
                    }

                    Box_No_List.push({"COPORATE_CD":rowData.COPORATE_CD, "DELI_NO":$("#txtORDR_NO").text(), "BOX_NO":rowData.BOX_NO, "BAR_QTY":rowData.BAR_QTY, "PART_CD":rowData.PART_CD, "USER_ID":getUSER_ID, "RTN_MSG":""});

                });

                $("#inputScan").focus();
            }
        });
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtORDR_NO").text() == "0"){
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
        save();
    }

    // PR_PDA_KD_060_C1 호출 및 저장
    var save = function() {
        saveflag = true;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_KD_060_C1.do',
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
            }
        });
    }

    var setClearClickEvent = function(){
        clear();
    };

    // 화면 초기화
    var clear = function() {
        $("#list_kd_060").html("");
        $("#txtORDR_NO").text("");
        $("#list_kd_060_head").addClass("blind");

        Box_No_List.length = 0;
        over_chk = false;
        deli_flag = false;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;

        $("#inpBoxQty").text("0");
        saveflag = false;
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