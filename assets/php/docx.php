<?php
declare(strict_types=1);

function docx_text(string $value): string {
    $value=preg_replace('/[^\x{9}\x{A}\x{D}\x{20}-\x{D7FF}\x{E000}-\x{FFFD}\x{10000}-\x{10FFFF}]/u','',$value)??'';
    return htmlspecialchars($value,ENT_XML1|ENT_QUOTES,'UTF-8');
}
function docx_paragraph(string $text,string $style='Normal'): string {
    $lines=explode("\n",str_replace(["\r\n","\r"],"\n",$text));
    return '<w:p><w:pPr><w:pStyle w:val="'.docx_text($style).'"/></w:pPr><w:r><w:t xml:space="preserve">'.implode('</w:t><w:br/><w:t xml:space="preserve">',array_map('docx_text',$lines)).'</w:t></w:r></w:p>';
}
function docx_table(array $headers,array $rows,array $widths): string {
    $xml='<w:tbl><w:tblPr><w:tblW w:w="9300" w:type="dxa"/><w:tblBorders>';
    foreach(['top','left','bottom','right','insideH','insideV'] as $side) $xml.='<w:'.$side.' w:val="single" w:sz="4" w:color="DCE5E9"/>';
    $xml.='</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>';
    foreach($widths as $width) $xml.='<w:gridCol w:w="'.$width.'"/>';
    $xml.='</w:tblGrid>';
    foreach(array_merge([$headers],$rows) as $index=>$row) {
        $xml.='<w:tr><w:trPr><w:cantSplit/>'.($index===0?'<w:tblHeader/>':'').'</w:trPr>';
        foreach($row as $col=>$value) {
            $fill=$index===0?'27734F':($index%2===1?'F1F6F3':'FFFFFF');
            $xml.='<w:tc><w:tcPr><w:tcW w:w="'.$widths[$col].'" w:type="dxa"/><w:shd w:val="clear" w:fill="'.$fill.'"/><w:vAlign w:val="center"/></w:tcPr>'.docx_paragraph((string)$value,$index===0?'TableHeader':(is_int($value)?'TableNumber':'TableText')).'</w:tc>';
        }
        $xml.='</w:tr>';
    }
    return $xml.'</w:tbl>'.docx_paragraph('','TableSpacer');
}
function docx_office_header(): string {
    $office=query("SELECT name,address,phone FROM office_contacts WHERE is_active=1 AND contact_type='office' ORDER BY sort_order,id LIMIT 1")->fetch();
    $body=docx_paragraph('CYBERLAWASSIST','Brand');
    $body.=docx_paragraph($office['name']??"Muntinlupa City District Office - Public Attorney's Office",'OfficeName');
    if(!empty($office['address'])) $body.=docx_paragraph($office['address'],'OfficeContact');
    if(!empty($office['phone'])) $body.=docx_paragraph('Telephone: '.$office['phone'],'OfficeContact');
    return $body.docx_paragraph('','LetterheadRule');
}
function checklist_document(array $user,array $items): string {
    $completed=count(array_filter($items,fn($item)=>$item['done']));
    $body=docx_office_header().docx_paragraph('Preparation Checklist','Title');
    $body.=docx_paragraph('Prepared for: '.$user['name']);
    $body.=docx_paragraph('Email: '.$user['email'],'Small');
    $body.=docx_paragraph('Generated: '.(new DateTimeImmutable('now',new DateTimeZone('Asia/Manila')))->format('d F Y, h:i A').' (Philippine time)','Small');
    $body.=docx_paragraph('Progress overview','Heading1');
    $body.=docx_table(['Total items','Completed','Pending'],[[count($items),$completed,count($items)-$completed]],[3100,3100,3100]);
    $body.=docx_paragraph('Preparation items','Heading1');
    $rows=[];foreach($items as $i=>$item) $rows[]=[$i+1,$item['label'],$item['done']?'Completed':'Pending'];
    if($rows) $body.=docx_table(['No.','Checklist item','Status'],$rows,[600,6900,1800]);
    else $body.=docx_paragraph('No checklist items have been saved yet.');
    $body.=docx_paragraph('Additional notes','Heading1');
    $body.=docx_paragraph('________________________________________________________________________');
    $body.=docx_paragraph('________________________________________________________________________');
    $body.=docx_paragraph('This checklist is a preparation aid. Contact the office for legal assistance.','Small');
    return $body;
}
function report_document(array $user,array $report): string {
    $period=match($report['range']) {'week'=>'Weekly','month'=>'Monthly','year'=>'Annual'};
    $start=new DateTimeImmutable($report['start']);$end=new DateTimeImmutable($report['end']);
    $body=docx_office_header().docx_paragraph($period.' Office Activity Report','Title');
    $body.=docx_paragraph('Reporting period: '.$start->format('d F Y').' to '.$end->format('d F Y'),'Subtitle');
    $body.=docx_paragraph('Prepared by: '.$user['name'].(!empty($user['admin_number'])?' | Admin no. '.$user['admin_number']:''),'Small');
    $body.=docx_paragraph('Generated: '.(new DateTimeImmutable('now',new DateTimeZone('Asia/Manila')))->format('d F Y, h:i A').' (Philippine time)','Small');
    $body.=docx_paragraph('Activity summary','Heading1');
    $body.=docx_table(['Indicator','Total'],[['Recorded intakes',$report['total']],['Resolved or referred',$report['completed']],['Awaiting follow-up',$report['pending']]],[7000,2300]);
    $body.=docx_paragraph($report['range']==='year'?'Monthly intake breakdown':'Daily intake breakdown','Heading1');
    $rows=[];
    foreach($report['buckets'] as $bucket) {
        $date=new DateTimeImmutable($bucket['key'].($report['range']==='year'?'-01':''));
        $rows[]=[$date->format($report['range']==='year'?'F Y':'d F Y'),$report['range']==='year'?'':$date->format('l'),$bucket['count']];
    }
    if($report['range']==='year') {
        $rows=array_map(fn($row)=>[$row[0],$row[2]],$rows);$rows[]=['TOTAL',$report['total']];
        $body.=docx_table(['Month','Recorded intakes'],$rows,[7000,2300]);
    } else {
        $rows[]=['TOTAL','',$report['total']];
        $body.=docx_table(['Visit date','Day','Recorded intakes'],$rows,[3700,3300,2300]);
    }
    if($report['total']===0) $body.=docx_paragraph('No intake records were saved for this reporting period.','Small');
    $body.=docx_paragraph('Reporting notes','Heading1');
    $body.=docx_paragraph('Counts use saved visit dates. Records without a visit date are excluded. Resolved or referred includes Completed and Referred records. Awaiting follow-up includes For review and In progress records.','Small');
    $body.=docx_paragraph('Review','Heading1');
    $body.=docx_paragraph('Prepared by: '.$user['name']);
    $body.=docx_paragraph('Reviewed by: __________________________________   Date: __________________');
    return $body;
}
function docx_bytes(string $title,string $body,string $author): string {
    $dir=dirname(__DIR__,4).'/cyberlawassist-private/exports';
    if(!is_dir($dir)&&!mkdir($dir,0700,true)&&!is_dir($dir)) fail(503,'Document storage is unavailable.');
    $reserved=tempnam($dir,'docx-');
    if($reserved===false) fail(503,'Could not create the Word document. Please try again.');
    $path=$reserved.'.zip';
    $w='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    $r='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    $rel='http://schemas.openxmlformats.org/package/2006/relationships';
    $generated=gmdate('Y-m-d\TH:i:s\Z');
    $styles=<<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:color w:val="193247"/><w:sz w:val="22"/><w:lang w:val="en-PH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="280" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Brand"><w:name w:val="Brand"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="27734F"/><w:sz w:val="20"/><w:spacing w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="OfficeName"><w:name w:val="Office name"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="OfficeContact"><w:name w:val="Office contact"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="50"/></w:pPr><w:rPr><w:color w:val="627487"/><w:sz w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="LetterheadRule"><w:name w:val="Letterhead rule"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="14" w:space="1" w:color="27734F"/></w:pBdr><w:spacing w:after="240" w:line="60" w:lineRule="exact"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="174B82"/><w:sz w:val="38"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:color w:val="627487"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="260" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="174B82"/><w:sz w:val="25"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="627487"/><w:sz w:val="18"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="260" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table header"/><w:basedOn w:val="TableText"/><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="TableNumber"><w:name w:val="Table number"/><w:basedOn w:val="TableText"/><w:pPr><w:jc w:val="right"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="TableSpacer"><w:name w:val="Table spacer"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="60" w:lineRule="exact"/></w:pPr></w:style>
</w:styles>
XML;
    $parts=[
        '[Content_Types].xml'=>'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
        '_rels/.rels'=>'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="'.$rel.'"><Relationship Id="rId1" Type="'.$r.'/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
        'docProps/core.xml'=>'<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>'.docx_text($title).'</dc:title><dc:creator>'.docx_text($author).'</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">'.$generated.'</dcterms:created></cp:coreProperties>',
        'word/document.xml'=>'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="'.$w.'" xmlns:r="'.$r.'"><w:body>'.$body.'<w:sectPr><w:footerReference w:type="default" r:id="rId2"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1303" w:bottom="1134" w:left="1303" w:header="567" w:footer="567"/></w:sectPr></w:body></w:document>',
        'word/styles.xml'=>$styles,
        'word/_rels/document.xml.rels'=>'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="'.$rel.'"><Relationship Id="rId1" Type="'.$r.'/styles" Target="styles.xml"/><Relationship Id="rId2" Type="'.$r.'/footer" Target="footer1.xml"/></Relationships>',
        'word/footer1.xml'=>'<?xml version="1.0" encoding="UTF-8"?><w:ftr xmlns:w="'.$w.'"><w:p><w:pPr><w:pStyle w:val="Small"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="8" w:color="DCE5E9"/></w:pBdr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve">CyberLawAssist | System-generated document | Page </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple><w:r><w:t xml:space="preserve"> of </w:t></w:r><w:fldSimple w:instr="NUMPAGES"><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>'
    ];
    try {
        // PharData writes standard ZIP packages without a separate ZIP extension.
        $archive=new PharData($path,0,null,Phar::ZIP);
        foreach($parts as $name=>$xml) $archive[$name]=$xml;
        unset($archive);
        $bytes=file_get_contents($path);
        if($bytes===false) fail(503,'Could not create the Word document. Please try again.');
        return $bytes;
    } finally {
        unset($archive);
        if(is_file($path)) Phar::unlinkArchive($path);
        if(is_file($reserved)) unlink($reserved);
    }
}
function docx_response(string $filename,string $title,string $body,string $author): never {
    if(session_status()===PHP_SESSION_ACTIVE) session_write_close();
    $bytes=docx_bytes($title,$body,$author);
    header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    header('Content-Disposition: attachment; filename="'.$filename.'"');
    header('Content-Length: '.strlen($bytes));
    echo $bytes;exit;
}
