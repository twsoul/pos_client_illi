/*******************************************************************
*	메인 페이지 로직
*******************************************************************/

var page = (function(window, document, $, M, undefined) {
    var getCORP_CD = userManager.getCORP_CD();
    var getUSER_NM = userManager.getUSER_NM();
    var getUSER_ID = userManager.getUSER_ID();
    var getWERKS = optionManager.getWERKS();
    var getLNG = optionManager.getLNG();
    var getVEND_CD = userManager.getVEND_CD();
    var saveUserCo = dataManager.storage('saveUserCo');

    var TM_NO_LIST = [];
    var C1_LIST = [];

    var Tot_Deli_Qty = 0;
    var Tot_Scan_Qty = 0;

    var coporate_cd = "";
    var plant_cd = "";
    var saveflag = false;

	// 화면 초기화
	var setInitScreen = function() {
	    if (getUSER_NM == "" || getUSER_NM == "undefined" || getUSER_NM == undefined) {
            screenManager.moveToPage('../common/login.html', { action: 'CLEAR_TOP' });
        }

        $("#txtINDATE").text(getCurrentTime());
        VendorName();
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

        // 비축 저장위치 변경 시 스캔 포커스
        $("#selSLOC").on('change', function() {
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

    // 현제 날짜를 구하는 함수
	var getCurrentTime = function(){
	    var today = new Date();

	    var year = today.getFullYear(); // 년도
	    var month = today.getMonth()+1; // 월(index가 0부터 시작하기 때문에 +1)
	    var date = today.getDate(); // 일
        var day = today.getDay(); // 요일을 숫자로 반환(ex 월요일 - 1)

        if(date<10){
            date = "0" + date;
        }

        return year + '.' + month + '.' + date
	}

	//  업체 이름 조회
    var VendorName = function() {
        console.log("SaveLocReq");
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PD_071_S2.do',
        	data: {
        	    'LANG': getLNG,
            	'VENDOR_CD': getVEND_CD
            },
        	success: function(receivedData, setting) {
        	    if(receivedData.ListCount != 0){
        	        var rowData = receivedData.ListData[0];
        	        $("#txtVENDOR").text(rowData.VENDOR_NM);
                }
                VendorLocTP();
        	},
        	error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    //  업체 저장위치 조회
    var VendorLocTP = function() {
        console.log("VendorLocTP");
        console.log("getVEND_CD : "+getVEND_CD);
        networkManager.httpSend({
            server: saveUserCo,
        	path: 'api/PD_071_S3.do',
        	data: {
        	    'LANG': getLNG,
        	    'COPORATE_CD': getCORP_CD,
            	'VENDOR_CD': getVEND_CD

            },
        	success: function(receivedData, setting) {
        	    var tag = "";
                $("#selPLOC").html("");
        	    if(receivedData.ListCount != 0){
        	        $.each(receivedData.ListData, function(index,rowData){
                       tag += "<option value='" + rowData.COM_CD + "'>" + rowData.COM_NM + "</option>";
                    });
                }
                $("#selPLOC").append(tag);
        	},
        	error: function(errorCode, errorMessage, settings) {
                console.log("error");
            }
        });
    }

    // 스캔시 처리 함수
    var ScanValidation = function(inputScan) {
        if($("#selPLOC").val() == null){
            popupManager.instance($("[data-lng='MSG.0000000117']").text(), {showtime:"LONG"}); // 저장위치를 먼저 선택하십시오
            $("#inputScan").focus();
            return;
        }

        if(inputScan.length > 0) {
            if($("#txtORDR_NO").text()== ""){
                MoveNoScan(inputScan);
            } else {
                if(inputScan.length < 12){
                    popupManager.instance($("[data-lng='MSG.0000000226']").text(), {showtime:"LONG"}); // 올바르지 않은 바코드 구성입니다
                    $("#inputScan").focus();
                    return;
                }
                TMScan(inputScan);
            }
        }
    }

   // 반출번호 조회 함수
   var MoveNoScan = function(move_no){
       console.log("MoveNoScan");
       networkManager.httpSend({
           server: saveUserCo,
           path: 'api/PD_071_S1.do',
           data: {
               'MOVE_NO':move_no,
               'LANG':getLNG,
               'event':'품번 조회'
           },
           success: function(receivedData, setting) {
               var rowData = receivedData.ListData[0];

               if(receivedData.ListCount == 0){
                   popupManager.instance($("[data-lng='MSG.0000000287']").text(), {showtime:"LONG"}); // 반출 번호가 존재하지 않습니다
                   $("#inputScan").focus();
                   return;
               }
               if (rowData.MOVE_YN == "Y") {
                   popupManager.instance($("[data-lng='MSG.0000000288']").text(), {showtime:"LONG"}); // 이미 반출된 반출번호입니다
                   $("#inputScan").focus();
                   return;
               }
               // 스캔 후 저장위치 선택 불가
               $("#selPLOC").attr("disabled",true);

               $.each(receivedData.ListData, function(index,rowData){
                   var tag = "";
                   var template = $("#ListTemplate").html();

                   $("#list_pd_071_head").removeClass("blind");
                   tag += template.replace(/\{\{COPORATE_CD\}\}/, rowData.COPORATE_CD)
                                  .replace(/\{\{PLANT_CD\}\}/, rowData.PLANT_CD)
                                  .replace(/\{\{MOVE_NO\}\}/, rowData.MOVE_NO)
                                  .replace(/\{\{MOVE_TYPE\}\}/, rowData.MOVE_TYPE)
                                  .replace(/\{\{MOVE_GB\}\}/, rowData.MOVE_GB)
                                  .replace(/\{\{MOVE_DESC\}\}/, rowData.MOVE_DESC)
                                  .replace(/\{\{MOVE_SEQ\}\}/, rowData.MOVE_SEQ)
                                  .replace(/\{\{PART_CD\}\}/gi, rowData.PART_CD)
                                  .replace(/\{\{MOVE_QTY\}\}/gi, rowData.MOVE_QTY)
                                  .replace(/\{\{VENDOR_CD\}\}/, rowData.VENDOR_CD)
                                  .replace(/\{\{VENDOR_NM\}\}/, rowData.VENDOR_NM)
                                  .replace(/\{\{SCAN_QTY\}\}/, rowData.SCAN_QTY);
                  $("#list_pd_071").append(tag);
                  $("#txtORDR_NO").text(rowData.MOVE_NO);
                  // 전체 스캔 수량
                  Tot_Deli_Qty += parseInt(rowData.MOVE_QTY);


               });

               coporate_cd = rowData.COPORATE_CD;
               plant_cd = rowData.PLANT_CD;
               console.log("Tot_Deli_Qty : "+Tot_Deli_Qty);
               $("#inputScan").focus();
           }
       });
   }

    // 품번 조회 함수
    var TMScan = function(TMBarCode){
        var bar_exists = false;

        // 부품식별표 중복 스캔 체크
        TM_NO_LIST.forEach(function(arr){
            if(TMBarCode == arr){
                bar_exists = true;
            }
        });
        if(!bar_exists){
            TM_NO_LIST.push(TMBarCode);
        } else {
            console.log("스캔 중복");
            popupManager.instance($("[data-lng='MSG.0000000269']").text(), {showtime:"LONG"}); // 이미 스캔한 부품식별표입니다
            $("#inputScan").focus();
            return;
        }
        $("#txtTMTAG").text(parseInt($("#txtTMTAG").text())+1);
        Tot_Scan_Qty++;

        if(Tot_Scan_Qty == Tot_Deli_Qty){
            $("#txtTMTAG").removeAttr('class').addClass("nBluebox1");
        } else if (Tot_Scan_Qty > Tot_Deli_Qty) {
            over_chk = true;
            $("#txtTMTAG").removeAttr('class').addClass("nRedbox1");
        }

        C1_LIST.push({"FROM_COPORATE_CD":coporate_cd,"FROM_PLANT_CD":plant_cd, "VENDOR_CD":getVEND_CD, "OT_LOC_TP":$("#selPLOC").val(), "TM_NO":TMBarCode, "MOVE_NO":$("#txtORDR_NO").text(), "USER_ID":getUSER_ID, "RTN_MSG":""});

        $("#inputScan").focus();
    }

    // 저장 조건 처리 로직
    var setSaveClickEvent = function(){
        if(saveflag){ return; }
        if($("#txtTMTAG").text() == "0"){
            popupManager.instance($("[data-lng='MSG.0000000137']").text(), {showtime:"LONG"}); // 스캔하신 내역이 없습니다
            $("#inputScan").focus();
            return;
        }

        $.each(C1_LIST,function(key,value){
            console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            $.each(value,function(key,value){
                console.log("key : " + key + " / " + "value : " + JSON.stringify(value));
            });
        });

        if(Tot_Scan_Qty != Tot_Deli_Qty){
            console.log("저장불가");
            popupManager.instance($("[data-lng='MSG.0000000292']").text(), {showtime:"LONG"}); // 스캔수량과 지시수량이 일치하지 않습니다
            $("#inputScan").focus();
            return;
        }else{
            save();
        }
    }

    // PR_PDA_PD_071_C1 호출 및 저장
    var save = function() {
        saveflag = ture;
        networkManager.httpSend({
            server: saveUserCo,
            path: 'api/PR_PDA_PD_071_C1.do',
            data: {
                'param1': C1_LIST
            },
            success: function(receivedData, setting) {
                if(receivedData.result=="S"){
                    popupManager.instance($("[data-lng='MSG.0000000272']").text(), {showtime:"LONG"}); // 저장이 완료되었습니다
                    clear();
                }else{
                    popupManager.instance($("[data-lng='MSG.0000000373']").text(), {showtime:"LONG"}); // 저장에 실패하였습니다
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

        $("#list_pd_071").html("");

        $("#list_pd_071_head").addClass("blind");
        $("#selPLOC").attr("disabled",false);
        TM_NO_LIST.length = 0;
        C1_LIST.length = 0;
        Tot_Deli_Qty = 0;
        Tot_Scan_Qty = 0;

        $("#txtTMTAG").text("0").removeAttr('class').addClass("nRedbox1");
        $("#txtORDR_NO").text("");
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