package com.hts.hable_pos;

import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;

public class MyPrintDocumentAdapter extends PrintDocumentAdapter {

    private final PrintDocumentAdapter delegate;
    private HTMLPrint HP;

    public MyPrintDocumentAdapter(PrintDocumentAdapter adapter){
        super();
        this.delegate = adapter;
    }

    public void setHTML(HTMLPrint HP){
        this.HP = HP;
    }

    @Override
    public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras){
        delegate.onLayout(oldAttributes,newAttributes,cancellationSignal,callback,extras);
    }

    @Override
    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal cancellationSignal, WriteResultCallback callback) {
        delegate.onWrite(pages,destination,cancellationSignal,callback);
    }

    @Override
    public void onFinish(){
        delegate.onFinish();

        HP.back();
    }


}
