package com.hts.hable_pos;

import android.content.Intent;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintJob;
import android.print.PrintManager;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.samskivert.mustache.Mustache;
import com.samskivert.mustache.Template;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import m.client.android.library.core.common.DataHandler;
import m.client.android.library.core.common.Parameters;
import m.client.android.library.core.model.NetReqOptions;
import m.client.android.library.core.view.AbstractActivity;

public class HTMLPrint extends AbstractActivity {

    private WebView wv = null;
    private PrintManager mgr = null;
    HTMLPrint HP = this;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mgr = (PrintManager) getSystemService(PRINT_SERVICE);
        printReport();
    }

    private void printReport() {
        Intent intent = getIntent() ;
        String MOVETYPE = intent.getStringExtra("MOVETYPE");
        String MOVENM = intent.getStringExtra("MOVENM");
        String VENDOR_NM = intent.getStringExtra("VENDOR_NM");
        String MOVENO = intent.getStringExtra("MOVENO");
        String MOVEDESC = intent.getStringExtra("MOVEDESC");
        String CREATE_NM = intent.getStringExtra("CREATE_NM");
        String TOTAL = intent.getStringExtra("TOTAL");
        String MOVE_DT = intent.getStringExtra("MOVE_DT");
        String[] PART_CD = intent.getStringArrayExtra("PART_CD");
        String[] PART_QTY = intent.getStringArrayExtra("PART_QTY");
        String[] PART_NM = intent.getStringArrayExtra("PART_NM");
        String[] BASIC_UNIT = intent.getStringArrayExtra("BASIC_UNIT");

        char N1=MOVENO.charAt(0);
        char N2=MOVENO.charAt(1);
        char N3=MOVENO.charAt(2);
        char N4=MOVENO.charAt(3);
        char N5=MOVENO.charAt(4);
        char N6=MOVENO.charAt(5);
        char N7=MOVENO.charAt(6);
        char N8=MOVENO.charAt(7);
        char N9=MOVENO.charAt(8);
        char N10=MOVENO.charAt(9);

        String DT_YEAR = MOVE_DT.substring(0,4);
        String DT_MONTH = MOVE_DT.substring(4,6);
        String DT_DAY = MOVE_DT.substring(6,8);
        String DT_HOUR = MOVE_DT.substring(8,10);
        String DT_MINUTE = MOVE_DT.substring(10,12);
        int part_cnt = PART_CD.length;

        String report_head = getString(R.string.report_head);
        String report_body1 = getString(R.string.report_body1);
        String report_list = "";
        String report_body2 = getString(R.string.report_body2);
        String report_line = getString(R.string.report_line);
        String report_line2 = getString(R.string.report_line2);
        String report_line3 = getString(R.string.report_line3);

        TpsReportContext tps = new TpsReportContext(MOVETYPE, MOVENM, VENDOR_NM, MOVENO, MOVEDESC, CREATE_NM, TOTAL, N1, N2, N3, N4, N5, N6, N7, N8, N9, N10, DT_YEAR, DT_MONTH, DT_DAY, DT_HOUR, DT_MINUTE);

        String test = report_head + report_body1;

        int No = 0;
        int pages=0;

        while(part_cnt>0){
            Log.wtf("HTMLPrint","part_cnt95 : "+part_cnt);
            if(part_cnt <= 45){
                Log.wtf("HTMLPrint","part_cnt97 : "+part_cnt);
                for(int i =0;i<part_cnt;i++){
                    No += 1;
                    String list = "<tr>"
                            +"<td>"+No+"</td>"
                            +"<td>"+PART_CD[No-1]+"</td>"
                            +"<td>"+PART_NM[No-1]+"</td>"
                            +"<td>"+PART_QTY[No-1]+"</td>"
                            +"<td>"+BASIC_UNIT[No-1]+"</td>"
                            +"<td></td>"
                            +"</tr>";
                    report_list += list;
                }
                for(int i =0;i<45-part_cnt;i++){
                    No += 1;
                    String list = "<tr>"
                            +"<td>"+No+"</td>"
                            +"<td></td>"
                            +"<td></td>"
                            +"<td></td>"
                            +"<td></td>"
                            +"<td></td>"
                            +"</tr>";
                    report_list += list;
                }
                part_cnt -= 45;
            }else if( part_cnt > 45 ){
                Log.wtf("HTMLPrint","part_cnt123 : "+part_cnt);
                for(int i =0;i<45;i++){
                    No += 1;
                    String list = "<tr>"
                            +"<td>"+No+"</td>"
                            +"<td>"+PART_CD[No-1]+"</td>"
                            +"<td>"+PART_NM[No-1]+"</td>"
                            +"<td>"+PART_QTY[No-1]+"</td>"
                            +"<td>"+BASIC_UNIT[No-1]+"</td>"
                            +"<td></td>"
                            +"</tr>";
                    report_list += list;
                }
                report_list += report_body2;
                if(pages == 0) {
                    report_list += report_line;
                    pages++;
                }else if(pages == 1) {
                    report_list += report_line2;
                    pages++;
                }else{
                    report_list += report_line3;
                    pages++;
                }

                report_list += report_head + report_body1;
                part_cnt -= 45;
            }
        }

        test += report_list;
        test += report_body2;

        Template tmpl = Mustache.compiler().compile(test);
        WebView print = prepPrintWebView(getString(R.string.tps_report));

        print.loadData(tmpl.execute(tps), "text/html; charset=UTF-8", null);
    }

    private WebView prepPrintWebView(final String name) {
        WebView result = getWebView();

        result.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                MyPrintDocumentAdapter printAdapter = new MyPrintDocumentAdapter(view.createPrintDocumentAdapter());

                printAdapter.setHTML(HP);

                print(name, printAdapter, new PrintAttributes.Builder().build());
            }
        });

        return (result);
    }

    private WebView getWebView() {
        if (wv == null) {
            wv = new WebView(this);
        }

        return (wv);
    }

    private PrintJob print(String name, PrintDocumentAdapter adapter, PrintAttributes attrs) {
        startService(new Intent(this, PrintJobMonitorService.class));

        return (mgr.print(name, adapter, attrs));
    }

    public void back(){
        finish();
    }


    private static class TpsReportContext {
        private static final SimpleDateFormat fmt = new SimpleDateFormat("yyyy년 MM월 dd일 HH시 mm분", Locale.KOREAN);
        Date time = new Date();
        String fmt_time = fmt.format(time.getTime());

        String MOVETYPE;
        String MOVENM;
        String VENDOR_NM;
        String MOVENO;
        String MOVEDESC;
        String CREATE_NM;
        String TOTAL;

        char N1,N2,N3,N4,N5,N6,N7,N8,N9,N10;

        String DT_YEAR;
        String DT_MONTH;
        String DT_DAY;
        String DT_HOUR;
        String DT_MINUTE;

        TpsReportContext(String MOVETYPE, String MOVENM, String VENDOR_NM, String MOVENO, String MOVEDESC, String CREATE_NM, String TOTAL, char N1, char N2, char N3, char N4, char N5, char N6, char N7, char N8, char N9, char N10, String DT_YEAR, String DT_MONTH, String DT_DAY, String DT_HOUR, String DT_MINUTE) {
            this.MOVETYPE = MOVETYPE;
            this.MOVENM = MOVENM;
            this.VENDOR_NM = VENDOR_NM;
            this.MOVENO = MOVENO;
            this.MOVEDESC = MOVEDESC;
            this.CREATE_NM = CREATE_NM;
            this.TOTAL = TOTAL;

            this.N1 = N1; this.N2 = N2; this.N3 = N3; this.N4 = N4; this.N5 = N5; this.N6 = N6; this.N7 = N7; this.N8 = N8; this.N9 = N9; this.N10 = N10;

            this.DT_YEAR = DT_YEAR;
            this.DT_MONTH = DT_MONTH;
            this.DT_DAY = DT_DAY;
            this.DT_HOUR = DT_HOUR;
            this.DT_MINUTE = DT_MINUTE;
        }

        @SuppressWarnings("unused")
        String getReportDate() {
            return (fmt_time);
        }

        @SuppressWarnings("unused")
        String getMOVETYPE() {
            return (MOVETYPE);
        }

        @SuppressWarnings("unused")
        String getMOVENM() {
            return (MOVENM);
        }

        @SuppressWarnings("unused")
        String getVENDOR_NM() {
            return (VENDOR_NM);
        }

        @SuppressWarnings("unused")
        String getMOVENO() {
            return (MOVENO);
        }

        @SuppressWarnings("unused")
        String getMOVEDESC() {
            return (MOVEDESC);
        }

        @SuppressWarnings("unused")
        String getLCREATE_NM() {
            return (CREATE_NM);
        }

        @SuppressWarnings("unused")
        String getTOTAL() {
            return (TOTAL);
        }

    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Don't forget to unregister the ACTION_FOUND receiver.
        // unregisterReceiver(receiver);
    }

    @Override
    public void onRestoreActivity(Parameters parameters) {

    }

    @Override
    public void onFinishedCaptureView() {

    }

    @Override
    public void onApplicationWillTerminate() {

    }

    @Override
    public void requestData(String s, String s1, DataHandler dataHandler, NetReqOptions netReqOptions) {

    }

    @Override
    public void responseData(int i, String s, String s1, String s2, NetReqOptions netReqOptions) {

    }

    @Override
    public void handlingError(String s, String s1, String s2, String s3, NetReqOptions netReqOptions) {

    }

}