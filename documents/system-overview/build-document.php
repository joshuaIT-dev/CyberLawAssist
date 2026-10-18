<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli') { http_response_code(404);exit; }

function fail(int $status,string $message): never { throw new RuntimeException($message,$status); }
require dirname(__DIR__,2).'/assets/php/docx.php';

try {
    $report=json_decode(file_get_contents(__DIR__.'/system-overview-content.json'),true,512,JSON_THROW_ON_ERROR);
    $body=docx_paragraph('CYBERLAWASSIST','Brand');
    $body.=docx_paragraph('Muntinlupa City District Office','OfficeName');
    $body.=docx_paragraph("Public Attorney's Office",'OfficeName');
    $body.=docx_paragraph('Ground Floor, Municipal City Hall of Justice Building, Right Wing, National Road, Tunasan, Muntinlupa, 1773 Metro Manila','OfficeContact');
    $body.=docx_paragraph('Telephone: (02) 8862 2525','OfficeContact');
    $body.=docx_paragraph('','LetterheadRule');
    $body.=docx_paragraph('System Overview and Plan Comparison','Title');
    $body.=docx_paragraph('ISO/IEC 25010:2011 Readiness Assessment','Title');
    $body.=docx_paragraph('Prepared: '.$report['date'],'Subtitle');
    $body.=docx_paragraph('Prepared for project proponents and office stakeholders.','Small');
    $body.=docx_table(['Document context','Scope'],[
        ['System snapshot','Current local XAMPP implementation, including the latest account controls, Word exports, cache/loading utilities, graphic 404, and Enter-to-send changes.'],
        ['Evidence basis','Current source and planning documents, owner-confirmed Live support, and group-owned NLP/content review.'],
        ['Evaluation status','Source-based assessment. No invented ISO score, certification, benchmark, participant result, or complete test pass is claimed.']
    ],[2300,7000]);
    $body.=docx_paragraph('Contents','Heading1');
    foreach($report['blocks'] as $block) if($block['type']==='heading') $body.=docx_paragraph($block['text'],'Small');
    $body.='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    foreach($report['blocks'] as $block) {
        $body.=match($block['type']) {
            'heading'=>docx_paragraph($block['text'],'Heading1'),
            'paragraph'=>docx_paragraph($block['text']),
            'table'=>docx_table($block['headers'],$block['rows'],$block['widths']),
            'page'=>'<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
            default=>throw new RuntimeException('Unknown document block type.')
        };
    }
    $filename=__DIR__.'/CyberLawAssist_System_Overview_and_ISO_25010_2011_Assessment.docx';
    $bytes=docx_bytes($report['title'],$body,'CyberLawAssist project documentation');
    if(file_put_contents($filename,$bytes,LOCK_EX)===false) throw new RuntimeException('Could not write the system document.');
    echo 'Created '.$filename.' ('.strlen($bytes)." bytes).\n";
} catch(Throwable $error) {
    fwrite(STDERR,'Document generation failed: '.$error->getMessage()."\n");
    exit(1);
}
