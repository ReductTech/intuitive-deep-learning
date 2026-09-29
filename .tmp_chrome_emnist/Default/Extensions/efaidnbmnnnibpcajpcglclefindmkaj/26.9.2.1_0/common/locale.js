/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2015 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property laws,
* including trade secret and or copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
const e={ca:"Permet l'accés als URL de fitxer",cs:"Umožnit přístup k adresám URL souborů",da:"Tillad adgang til webadresser på filer",de:"Zugriff auf Datei-URLs zulassen",en:"Allow access to file URLs",en_GB:"Allow access to file URLs",es:"Permitir acceso a URL de archivo",eu:"Allow access to file URLs",fi:"Salli tiedostojen URL-osoitteiden käyttö",fr:"Autoriser l'accès aux URL de fichier",hr:"Dozvoli pristup URL-ovima datoteke",hu:"Fájl URL-ekhez való hozzáférés engedélyezése",it:"Consenti l'accesso agli URL dei file",ja:"ファイルの URL へのアクセスを許可する",ko:"파일 URL에 대한 액세스 허용",nb:"Tillat tilgang til filnettadresser",nl:"Toegang tot bestand-URL's toestaan",pl:"Zezwalaj na dostęp do adresów URL plików",pt:"Permitir acesso a URLs de arquivo",pt_BR:"Permitir acesso a URLs de arquivo",ro:"Permite accesul la adresele URL de fișiere",ru:"Разрешить открывать локальные файлы по ссылкам",sk:"Povoliť prístup k webovým adresám súboru",sl:"Dovoli dostop do URL-jev datoteke",sv:"Tillåt åtkomst till webbadresser i filen",tr:"Dosya URL'lerine erişime izin ver",uk:"Надавати доступ до URL-адрес файлу",zh_CN:"允许访问文件网址",zh_TW:"允許存取檔案網址"},a={ca:"Fixa a la barra d'eines",cs:"Připnout na panel nástrojů",da:"Fastgør til værktøjslinje",de:"An die Symbolleiste anheften",en:"Pin to toolbar",en_GB:"Pin to toolbar",es:"Fijar en la barra de herramientas",eu:"Finkatu tresna-barra",fi:"Kiinnitä työkalupalkkiin",fr:"Épingler à la barre d'outils",hr:"Prikvači na alatnu traku",hu:"Rögzítés a szerszámsávra",it:"Fissa alla barra degli strumenti",ja:"ツールバーにピン留め",ko:"도구 모음에 고정",nb:"Fest til verktøylinjen",nl:"Vastmaken aan de werkbalk",pl:"Przypnij do paska narzędzi",pt:"Fixar na barra de ferramentas",pt_BR:"Fixar na barra de ferramentas",ro:"Fixează pe bara de unelte",ru:"Закрепить на панели инструментов",sk:"Pripnúť na panel nástrojov",sl:"Pripni na orodno vrstico",sv:"Fäst vid verktygsfältet",tr:"Araç çubuğuna sabitle",uk:"Прикріпити до панелі інструментів",zh_CN:"固定到工具栏",zh_TW:"固定到工具列"};export const getLocale=()=>{let e=chrome.i18n.getMessage("@@ui_locale");return["ca","cs","da","de","en","en_GB","es","eu","fi","fr","hr","hu","it","ja","ko","nb","nl","pl","pt","pt_BR","ro","ru","sk","sl","sv","tr","uk","zh_CN","zh_TW"].includes(e)||(e="en"),e};export const getAllowAccessToFileUrl=()=>{const a=getLocale();return encodeURIComponent(e[a]).replace("-","%2D")};export const getPinToToolbarUrl=()=>{const e=getLocale();return encodeURIComponent(a[e]).replace("-","%2D")};