#Requires AutoHotkey v2.0
#SingleInstance Force
SetTitleMatchMode 2   ; "contém": o título só precisa CONTER a palavra de JANELA (o original usava "começa com")

; ============================================================================
; CARIMBAR MV nuvem 1.0  (Grok Bot)
; Leva o fluxo do CARIMBAR 1.3/1.4 (você aperta, a IA responde pela nuvem, você confirma) para as telas
; em Flash do SoulMV, onde nenhum programa consegue ler os campos.
;   Ctrl+Alt+M (ou o botão CARIMBAR) -> escolhe a tela -> tira 1 a 4 fotos da janela do MV -> envia para a nuvem
;   -> espera a IA (Supabase "carimbar") -> mostra o paciente e a prévia de cada campo -> você confirma
;   -> o programa cola cada campo com Ctrl+V, com Tab entre eles.
; NUNCA salva nada no MV, nunca aperta Enter nem atalhos de salvar. Só Ctrl+V, Ctrl+A (no "substituir") e Tab.
; Reaproveita do carimbar-mv-revisado-grok.ahk: checagem do título, confirmação com padrão Cancelar,
; guarda e restauração da área de transferência, mapa TELAS e o leitor de JSON.
; ============================================================================

; ===== configuração =====
JANELA := "SoulMV"        ; trecho do título da janela do MV onde é permitido fotografar e colar
SUPA_URL := "https://ybcoiphfbkmnzfppkryq.supabase.co"
SUPA_KEY := "sb_publishable_FMNJjtCEZ_HYVliMWgnfgA_PEBAzeGM"   ; chave pública do CARIMBAR (só executa funções liberadas)
ATRASO_TAB := 250         ; pausa em ms depois de cada Tab
ATRASO_COLAR := 400       ; pausa em ms depois de cada Ctrl+V (se o MV colar texto antigo, aumente para 1000)
USAR_CRLF := true         ; true = quebras CRLF; se o MV mostrar linha em branco dobrada, troque para false
MAX_FOTOS := 4            ; fotos por envio (role a tela e use "Mais uma foto")
FOTO_LARGURA := 1280      ; largura máxima de cada foto em pixels
FOTO_QUALIDADE := 60      ; qualidade JPEG (0-100)
INTERVALO_MS := 2000      ; consulta a nuvem a cada 2 s
ESPERA_MAX_MS := 900000   ; desiste depois de 15 min sem resposta
VERSAO := "MV-nuvem 1.0"

; ===== telas =====
; Cada tela é a lista de chaves do JSON na ORDEM DOS CAMPOS (um Tab entre elas). "" = campo que só leva um Tab (pulado).
; Chave sem valor no JSON também só leva o Tab, para o resto não desalinhar.
; SÓ A "evolucao" (um campo só) é conhecida de verdade. As outras são EXEMPLOS: confirme a ordem do Tab no hospital
; (com paciente de teste, sem salvar) e ajuste a lista antes de usar de verdade. Veja o LEIAME.
ORDEM := []
TELAS := Map()
TELA_TITULO := Map()
TELA_EXEMPLO := Map()
AddTela(nome, titulo, chaves, exemplo) {
    ORDEM.Push(nome)
    TELAS[nome] := chaves
    TELA_TITULO[nome] := titulo
    TELA_EXEMPLO[nome] := exemplo
}
AddTela("evolucao", "Evolução", ["evolucao"], false)
; ---- EXEMPLOS (ordem do Tab a confirmar no hospital) ----
AddTela("prescricao", "Prescrição", ["prescricao", "orientacoes"], true)
AddTela("exames", "Solicitação de exames", ["exames", "indicacao"], true)
AddTela("admissao", "Admissão / anamnese", ["queixa", "hda", "antecedentes", "medicamentos", "alergias", "exameFisico", "hipotese", "conduta"], true)
AddTela("alta", "Alta / sumário", ["diagnostico", "resumo", "condicaoAlta", "orientacoes", "retorno"], true)
AddTela("antropometria", "Antropometria", ["data", "altura", "peso", "gordura", "cCintura", "cQuadril", "cBraco", "cPescoco"], true)

; ===== estado =====
E := Map("ocupado", false, "consultando", false, "colando", false, "ultimaMV", 0, "ultimaAtiva", 0)
BTN := ""
CODIGO := ""

^!m:: Capturar(true)

if !IsSet(NAO_INICIAR)     ; (os testes automáticos definem NAO_INICIAR antes de incluir este arquivo)
    Iniciar()

Iniciar() {
    global BTN
    CarregaCodigo()
    BTN := Gui("+AlwaysOnTop +ToolWindow +E0x08000000", "CARIMBAR")   ; E0x08000000 = não rouba o foco do MV
    BTN.SetFont("s10 bold")
    b := BTN.Add("Button", "w130 h34", "CARIMBAR")
    b.OnEvent("Click", (*) => Capturar(false))
    BTN.OnEvent("Close", (*) => ExitApp())
    BTN.Show("NoActivate x" . Max(0, A_ScreenWidth - 180) . " y10 AutoSize")
    SetTimer(RastreiaMV, 100)
    A_IconTip := "CARIMBAR MV nuvem (Ctrl+Alt+M)"
}

; Guarda a última janela ativa que NÃO é do CARIMBAR (e a última do MV). Serve para saber, se o clique no CARIMBAR tomar o foco,
; de onde o foco veio: só se veio do MV é que o programa o devolve ao MV.
RastreiaMV() {
    h := WinExist("A")
    if (!h || EhJanelaCarimbar(h))
        return
    E["ultimaAtiva"] := h
    if WinActive(JANELA)
        E["ultimaMV"] := h
}

EhJanelaCarimbar(h) {
    for k in ["gEscolha", "gFotos", "gEspera", "gConf"] {
        try {
            if (E.Has(k) && E[k].Hwnd = h)
                return true
        }
    }
    try {
        return (BTN != "" && BTN.Hwnd = h)
    }
    return false
}

; ===== sessão (código secreto, guardado só neste computador) =====
CarregaCodigo() {
    global CODIGO
    dir := A_AppData . "\CarimbarMV"
    arq := dir . "\sessao.txt"
    c := ""
    try c := Trim(FileRead(arq))
    if !RegExMatch(c, "^[A-Za-z0-9_-]{32,128}$") {
        c := NovoCodigo()
        DirCreate dir
        try FileDelete arq
        FileAppend c, arq
    }
    CODIGO := c
}

NovoCodigo() {
    b := Buffer(32, 0)
    DllCall("advapi32\SystemFunction036", "ptr", b, "uint", 32)
    s := Base64Buf(b, 32)
    return RegExReplace(StrReplace(StrReplace(s, "+", "-"), "/", "_"), "=+$")
}

Base64Buf(buf, n) {
    DllCall("crypt32\CryptBinaryToStringW", "ptr", buf, "uint", n, "uint", 0x40000001, "ptr", 0, "uint*", &len := 0)
    out := Buffer(len * 2, 0)
    DllCall("crypt32\CryptBinaryToStringW", "ptr", buf, "uint", n, "uint", 0x40000001, "ptr", out, "uint*", &len)
    return StrGet(out, "UTF-16")
}

; ===== fluxo principal =====
Capturar(viaHotkey) {
    if E["ocupado"] {
        MsgBox "Já existe uma extração em andamento (janela 'aguardando a IA' ou de confirmação). Termine ou cancele antes de começar outra.", "CARIMBAR MV", "Icon! 262144"
        return
    }
    if viaHotkey {
        KeyWait "Ctrl"
        KeyWait "Alt"
    }
    hwnd := AlvoMV()
    if !hwnd
        return
    E["ocupado"] := true
    try {
        Fluxo(hwnd)
    } catch as err {
        Libera()
        MsgBox "Erro: " . err.Message . "`n`nNada foi colado no MV.", "CARIMBAR MV", "Iconx 262144"
    }
}

; Devolve o hwnd da janela do MV que está na frente (ou "" depois de avisar)
AlvoMV() {
    if WinActive(JANELA)
        return WinExist("A")
    ; se o clique no botão CARIMBAR tomou o foco, volta para a última janela do MV conhecida
    if (EhJanelaCarimbar(WinExist("A")) && E["ultimaMV"] && E["ultimaAtiva"] = E["ultimaMV"] && WinExist("ahk_id " . E["ultimaMV"])) {
        WinActivate "ahk_id " . E["ultimaMV"]
        if WinWaitActive(JANELA . " ahk_id " . E["ultimaMV"], , 2)
            return E["ultimaMV"]
    }
    MsgBox "A janela ativa não é a do " . JANELA . ". Nada foi enviado.`n`nJanela ativa agora: " . DescreveJanela(), "CARIMBAR MV", "Iconx 262144"
    return 0
}

Fluxo(hwnd) {
    r := EscolherTela()
    if !r["ok"] {
        Libera()
        return
    }
    tela := r["tela"]
    if !AtivaMV(hwnd) {
        Libera()
        return
    }
    fotos := []
    if !Foto(hwnd, fotos, []) {
        Libera()
        return
    }
    if !JanelaFotos(hwnd, fotos, tela) {
        Libera()
        return
    }
    E["hwnd"] := hwnd
    E["tela"] := tela
    E["titulo"] := WinGetTitle("ahk_id " . hwnd)
    ToolTip "Enviando para a nuvem..."
    try {
        id := EnviaExtracao(hwnd, tela, fotos)
    } catch as err {
        ToolTip
        throw err
    }
    ToolTip
    E["extId"] := id
    E["horaEnvio"] := FormatTime(, "HH:mm:ss")
    E["tickEnvio"] := A_TickCount
    E["nFotos"] := fotos.Length
    E["ignoradas"] := 0
    E["vistos"] := Map()
    E["erroRede"] := ""
    IniciaEspera()
}

; ===== escolha da tela =====
Rotulo(n) {
    return TELA_TITULO[n] . (TELA_EXEMPLO[n] ? " (" . n . ", EXEMPLO)" : " (" . n . ")")
}

DescreveTela(n) {
    s := "Campos, na ordem do Tab: " . Juntar(TELAS[n], " > ")
    if TELA_EXEMPLO[n]
        s .= "`n`nATENÇÃO: tela de EXEMPLO. A ordem do Tab ainda não foi conferida no hospital. Teste com paciente de teste e não salve."
    return s
}

EscolherTela() {
    res := Map("ok", false, "tela", "")
    g := Gui("+AlwaysOnTop +ToolWindow", "CARIMBAR MV: qual tela?")
    E["gEscolha"] := g
    g.SetFont("s10")
    g.Add("Text", "w420", "Qual tela do MV está aberta agora?")
    rot := []
    for n in ORDEM
        rot.Push(Rotulo(n))
    dd := g.Add("DropDownList", "w420 Choose1", rot)
    info := g.Add("Text", "w420 h90")
    Atualiza(*) {
        info.Value := DescreveTela(ORDEM[dd.Value])
    }
    dd.OnEvent("Change", Atualiza)
    Atualiza()
    bOk := g.Add("Button", "w130 Default", "Continuar")
    bNo := g.Add("Button", "x+10 w130", "Cancelar")
    Fecha(*) {
        g.Destroy()
    }
    bOk.OnEvent("Click", (*) => (res["ok"] := true, res["tela"] := ORDEM[dd.Value], Fecha()))
    bNo.OnEvent("Click", Fecha)
    g.OnEvent("Close", Fecha)
    g.OnEvent("Escape", Fecha)
    g.Show()
    WinWaitClose "ahk_id " . g.Hwnd
    return res
}

; ===== fotos =====
; Garante que o MV (este hwnd) está na frente
AtivaMV(hwnd) {
    spec := JANELA . " ahk_id " . hwnd
    if WinActive(spec)
        return true
    try WinActivate "ahk_id " . hwnd
    if WinWaitActive(spec, , 2)
        return true
    MsgBox "O MV deixou de ser a janela ativa. Nada foi enviado.`n`nJanela ativa agora: " . DescreveJanela(), "CARIMBAR MV", "Iconx 262144"
    return false
}

; Tira uma foto da janela do MV (escondendo as janelas do CARIMBAR) e acrescenta em "fotos"
Foto(hwnd, fotos, esconder) {
    if !AtivaMV(hwnd)
        return false
    if (BTN != "")
        esconder.Push(BTN)
    for g in esconder
        g.Hide()
    Sleep 400
    arq := A_Temp . "\carimbar-mv-foto-" . A_TickCount . ".jpg"
    ok := false
    erro := ""
    try {
        larg := FOTO_LARGURA, qual := FOTO_QUALIDADE
        loop 3 {
            CapturaJpeg(hwnd, arq, larg, qual)
            b64 := Base64Arquivo(arq)
            if (StrLen(b64) <= 800000) {
                ok := true
                break
            }
            larg := Round(larg * 0.75)
            qual := Max(30, qual - 10)
        }
        if !ok
            erro := "a foto ficou grande demais mesmo depois de reduzir"
    } catch as ex {
        erro := ex.Message
    }
    try FileDelete arq
    for g in esconder
        g.Show("NoActivate")
    if !ok {
        MsgBox "Não consegui tirar a foto da janela do MV: " . erro, "CARIMBAR MV", "Iconx 262144"
        return false
    }
    fotos.Push(Map("mime", "image/jpeg", "b64", b64))
    return true
}

; Janela "Fotos": Mais uma foto / Enviar para a IA / Cancelar. Devolve true se for para enviar.
JanelaFotos(hwnd, fotos, tela) {
    st := Map("acao", "")
    g := Gui("+AlwaysOnTop +ToolWindow +E0x08000000", "CARIMBAR MV: fotos")
    E["gFotos"] := g
    g.SetFont("s10")
    txt := g.Add("Text", "w440 h80")
    bMais := g.Add("Button", "w140", "Mais uma foto")
    bEnv := g.Add("Button", "x+8 w150", "Enviar para a IA")
    bNo := g.Add("Button", "x+8 w120 Default", "Cancelar")
    Atualiza() {
        n := fotos.Length
        txt.Value := "Tela: " . TELA_TITULO[tela] . "`nFotos tiradas: " . n . " de " . MAX_FOTOS . ".`n"
            . "Se a tela é longa: role o MV até a parte que falta e clique em 'Mais uma foto'. Quando estiver tudo, clique em 'Enviar para a IA'."
        bMais.Enabled := (n < MAX_FOTOS)
        bEnv.Enabled := (n >= 1)
    }
    MaisUma(*) {
        if (fotos.Length >= MAX_FOTOS)
            return
        Foto(hwnd, fotos, [g])
        Atualiza()
    }
    bMais.OnEvent("Click", MaisUma)
    bEnv.OnEvent("Click", (*) => st["acao"] := "enviar")
    bNo.OnEvent("Click", (*) => st["acao"] := "cancelar")
    g.OnEvent("Close", (*) => st["acao"] := "cancelar")
    Atualiza()
    g.Show("NoActivate")
    while (st["acao"] = "")
        Sleep 100
    g.Destroy()
    return (st["acao"] = "enviar")
}

; ===== captura de tela (GDI+, sem bibliotecas) =====
CapturaJpeg(hwnd, caminho, maxL, qualidade) {
    rect := Buffer(16, 0)
    ok := false
    try ok := (DllCall("dwmapi\DwmGetWindowAttribute", "ptr", hwnd, "uint", 9, "ptr", rect, "uint", 16) = 0)
    if !ok
        DllCall("GetWindowRect", "ptr", hwnd, "ptr", rect)
    x := NumGet(rect, 0, "int"), y := NumGet(rect, 4, "int")
    w := NumGet(rect, 8, "int") - x, h := NumGet(rect, 12, "int") - y
    if (w < 50 || h < 50)
        throw Error("a janela do MV está pequena demais ou minimizada")
    esc := (w > maxL) ? maxL / w : 1
    w2 := Max(1, Round(w * esc)), h2 := Max(1, Round(h * esc))
    hdc := DllCall("GetDC", "ptr", 0, "ptr")
    hdcM := DllCall("CreateCompatibleDC", "ptr", hdc, "ptr")
    hbm := DllCall("CreateCompatibleBitmap", "ptr", hdc, "int", w2, "int", h2, "ptr")
    obm := DllCall("SelectObject", "ptr", hdcM, "ptr", hbm, "ptr")
    DllCall("SetStretchBltMode", "ptr", hdcM, "int", 4)
    DllCall("StretchBlt", "ptr", hdcM, "int", 0, "int", 0, "int", w2, "int", h2, "ptr", hdc, "int", x, "int", y, "int", w, "int", h, "uint", 0x40CC0020)
    DllCall("SelectObject", "ptr", hdcM, "ptr", obm)
    si := Buffer(A_PtrSize = 8 ? 24 : 16, 0)
    NumPut("uint", 1, si)
    st := DllCall("gdiplus\GdiplusStartup", "ptr*", &tok := 0, "ptr", si, "ptr", 0, "uint")
    res := -1
    pb := 0
    if (st = 0) {
        DllCall("gdiplus\GdipCreateBitmapFromHBITMAP", "ptr", hbm, "ptr", 0, "ptr*", &pb)
        if pb {
            clsid := Buffer(16, 0)
            DllCall("ole32\CLSIDFromString", "wstr", "{557CF401-1A04-11D3-9A73-0000F81EF32E}", "ptr", clsid)   ; codificador JPEG
            ep := Buffer(A_PtrSize = 8 ? 40 : 32, 0)
            val := Buffer(4, 0)
            NumPut("uint", qualidade, val)
            NumPut("uint", 1, ep, 0)
            o := (A_PtrSize = 8) ? 8 : 4
            DllCall("ole32\CLSIDFromString", "wstr", "{1D5BE4B5-FA4A-452D-9CDD-5DB35105E7EB}", "ptr", ep.Ptr + o)   ; EncoderQuality
            NumPut("uint", 1, ep, o + 16)      ; NumberOfValues
            NumPut("uint", 4, ep, o + 20)      ; Type = Long
            NumPut("ptr", val.Ptr, ep, o + 24)
            res := DllCall("gdiplus\GdipSaveImageToFile", "ptr", pb, "wstr", caminho, "ptr", clsid, "ptr", ep, "uint")
            DllCall("gdiplus\GdipDisposeImage", "ptr", pb)
        }
        DllCall("gdiplus\GdiplusShutdown", "ptr", tok)
    }
    DllCall("DeleteObject", "ptr", hbm)
    DllCall("DeleteDC", "ptr", hdcM)
    DllCall("ReleaseDC", "ptr", 0, "ptr", hdc)
    if (res != 0 || !FileExist(caminho))
        throw Error("a captura de tela falhou (GDI+ código " . res . ")")
}

Base64Arquivo(caminho) {
    f := FileOpen(caminho, "r")
    n := f.Length
    buf := Buffer(n)
    f.RawRead(buf, n)
    f.Close()
    return Base64Buf(buf, n)
}

; ===== envio e consulta (WinHttp, HTTPS) =====
Http(rota, corpo, timeoutMs := 30000) {
    h := ComObject("WinHttp.WinHttpRequest.5.1")
    h.SetTimeouts(10000, 10000, timeoutMs, timeoutMs * 2)
    h.Open("POST", SUPA_URL . "/rest/v1/rpc/" . rota, false)
    h.SetRequestHeader("apikey", SUPA_KEY)
    h.SetRequestHeader("Content-Type", "application/json; charset=utf-8")
    n := StrPut(corpo, "UTF-8") - 1
    buf := Buffer(n + 1, 0)
    StrPut(corpo, buf, "UTF-8")
    sa := ComObjArray(0x11, n)
    DllCall("oleaut32\SafeArrayAccessData", "ptr", ComObjValue(sa), "ptr*", &pd := 0)
    DllCall("RtlMoveMemory", "ptr", pd, "ptr", buf, "uptr", n)
    DllCall("oleaut32\SafeArrayUnaccessData", "ptr", ComObjValue(sa))
    h.Send(sa)
    texto := ""
    try {
        rb := h.ResponseBody
        m := rb.MaxIndex() + 1
        if (m > 0) {
            DllCall("oleaut32\SafeArrayAccessData", "ptr", ComObjValue(rb), "ptr*", &pr := 0)
            texto := StrGet(pr, m, "UTF-8")
            DllCall("oleaut32\SafeArrayUnaccessData", "ptr", ComObjValue(rb))
        }
    }
    return Map("status", h.Status, "texto", texto)
}

EnviaExtracao(hwnd, tela, fotos) {
    chaves := TELAS[tela]
    nomes := []
    ordemTab := []
    for c in chaves {
        ordemTab.Push(c = "" ? "(pular)" : c)
        if (c != "")
            nomes.Push(c)
    }
    conteudo := '{"carimbar":' . Jstr(VERSAO)
        . ',"origem":"carimbar-mv"'
        . ',"tela":' . Jstr(tela)
        . ',"telaExemplo":' . (TELA_EXEMPLO[tela] ? "true" : "false")
        . ',"titulo":' . Jstr(SubStr(WinGetTitle("ahk_id " . hwnd), 1, 200))
        . ',"enviadoEm":' . Jstr(FormatTime(A_NowUTC, "yyyy-MM-dd'T'HH:mm:ss'Z'"))
        . ',"tiposDetectados":[' . Jstr(tela) . ']'
        . ',"chavesCarimbar":{' . Jstr(tela) . ':' . ArrJson(nomes) . '}'
        . ',"ordemTab":' . ArrJson(ordemTab)
        . ',"formato":' . Jstr("Tela do SoulMV (Flash): os campos não são legíveis, a extração é uma FOTO da janela (baixe as imagens com carimbar_imagem). Responda com carimbar.responder_mv(<id da extração>, json). JSON plano com paciente (nome como aparece no cabeçalho do MV, confirme com o médico) e prontuario, mais as chavesCarimbar na ordem do Tab. Datas DD/MM/AAAA; texto livre com \n entre as linhas.")
        . ',"pacienteNaTela":null,"campos":[],"editores":[]}'
    imgs := ""
    for f in fotos
        imgs .= (imgs = "" ? "" : ",") . '{"mime":' . Jstr(f["mime"]) . ',"b64":"' . f["b64"] . '"}'
    corpo := '{"p_codigo":' . Jstr(CODIGO)
        . ',"p_conteudo":' . conteudo
        . ',"p_url":' . Jstr("carimbar-mv://" . tela)
        . ',"p_pagina":' . Jstr("carimbar-mv:" . tela)
        . ',"p_imagens":[' . imgs . ']}'
    r := Http("carimbar_enviar_mv", corpo, 60000)
    t := Trim(r["texto"])
    if (r["status"] != 200 || !RegExMatch(t, "^\d+$"))
        throw Error("a nuvem não aceitou o envio (HTTP " . r["status"] . "): " . SubStr(t, 1, 300))
    return Integer(t)
}

; ===== espera da resposta =====
IniciaEspera() {
    g := Gui("+AlwaysOnTop +ToolWindow +E0x08000000", "CARIMBAR MV: aguardando a IA")
    g.SetFont("s11 bold")
    g.Add("Text", "w440", "Enviado. Aguardando a IA...")
    g.SetFont("s9 norm")
    E["gEspera"] := g
    E["txtEspera"] := g.Add("Text", "w440 h110")
    b := g.Add("Button", "w120 Default", "Cancelar")
    b.OnEvent("Click", (*) => CancelaEspera())
    g.OnEvent("Close", (*) => CancelaEspera())
    AtualizaEspera()
    g.Show("NoActivate")
    SetTimer(Consulta, INTERVALO_MS)
}

AtualizaEspera() {
    seg := (A_TickCount - E["tickEnvio"]) // 1000
    s := "Tela: " . TELA_TITULO[E["tela"]] . " (" . E["tela"] . ")  |  fotos: " . E["nFotos"]
        . "`nExtração nº " . E["extId"] . "  |  sessão " . SubStr(CODIGO, 1, 8)
        . "`nEnviado às " . E["horaEnvio"] . "  (esperando há " . (seg // 60) . ":" . Format("{:02}", Mod(seg, 60)) . "; desiste em 15 min)"
        . "`nDiga à IA no chat o que preencher. Quando ela responder, esta janela muda sozinha."
    if (E["ignoradas"] > 0)
        s .= "`nIgnoradas " . E["ignoradas"] . " resposta(s) que não são desta extração."
    if (E["erroRede"] != "")
        s .= "`nSem rede agora (" . E["erroRede"] . "); tentando de novo."
    E["txtEspera"].Value := s
}

CancelaEspera() {
    Libera()
}

Consulta() {
    if (!E["ocupado"] || E["consultando"] || !E.Has("extId"))
        return
    if (A_TickCount - E["tickEnvio"] > ESPERA_MAX_MS) {
        Libera()
        MsgBox "A IA não respondeu em 15 minutos. Nada foi colado. Se ainda quiser, comece de novo com Ctrl+Alt+M.", "CARIMBAR MV", "Icon! 262144"
        return
    }
    E["consultando"] := true
    achou := false
    try {
        r := Http("carimbar_buscar", '{"p_codigo":' . Jstr(CODIGO) . ',"p_desde_id":' . E["extId"] . '}', 15000)
        if (r["status"] != 200)
            throw Error("HTTP " . r["status"])
        E["erroRede"] := ""
        achou := ProcessaLinhas(r["texto"])
    } catch as err {
        E["erroRede"] := SubStr(err.Message, 1, 80)
    }
    E["consultando"] := false
    if (achou || !E["ocupado"])
        return
    AtualizaEspera()
}

; Procura, entre os carimbos recebidos, o que é DESTA extração. Devolve true se achou e já abriu a confirmação.
ProcessaLinhas(texto) {
    linhas := LerLinhas(texto)
    for lin in linhas {
        if (!lin.Has("id") || !lin.Has("conteudo"))
            continue
        if (Integer(lin["id"]) <= E["extId"] || E["vistos"].Has(lin["id"]))
            continue
        E["vistos"][lin["id"]] := true     ; cada resposta ignorada é contada uma vez só
        try {
            dados := ParseJsonFlat(lin["conteudo"])
        } catch {
            E["ignoradas"] += 1
            continue
        }
        ; AMARRA a resposta à extração: o JSON tem de trazer "extracao" igual ao número enviado (carimbar.responder_mv faz isso sozinho)
        if (!dados.Has("extracao") || !RegExMatch(dados["extracao"], "^\d+$") || Integer(dados["extracao"]) != E["extId"]) {
            E["ignoradas"] += 1
            continue
        }
        if (dados.Has("tela") && dados["tela"] != "" && dados["tela"] != E["tela"]) {
            E["ignoradas"] += 1
            continue
        }
        SetTimer(Consulta, 0)
        try E["gEspera"].Destroy()
        Confirma(dados)
        return true
    }
    return false
}

; ===== confirmação =====
Confirma(dados) {
    tela := E["tela"]
    chaves := TELAS[tela]
    paciente := Trim(Valor(dados, "paciente"))
    prontuario := Trim(Valor(dados, "prontuario"))
    g := Gui("+AlwaysOnTop +ToolWindow +E0x08000000", "CARIMBAR MV: confirmar " . tela)   ; NoActivate: o MV continua com o foco
    E["gConf"] := g
    g.SetFont("s12 bold")
    g.Add("Text", "w640 " . (paciente = "" ? "cRed" : ""), "Paciente no JSON: " . (paciente != "" ? paciente : "NÃO INFORMADO"))
    g.SetFont("s10 norm")
    if (prontuario != "")
        g.Add("Text", "w640", "Prontuário: " . prontuario)
    seg := (A_TickCount - E["tickEnvio"]) // 1000
    g.Add("Text", "w640", "Tela: " . TELA_TITULO[tela] . " (" . tela . ")  |  extração nº " . E["extId"] . "  |  enviada às " . E["horaEnvio"] . " (há " . (seg // 60) . " min " . Mod(seg, 60) . " s)  |  sessão " . SubStr(CODIGO, 1, 8))
    if TELA_EXEMPLO[tela]
        g.Add("Text", "w640 cRed", "TELA DE EXEMPLO: a ordem do Tab ainda não foi conferida no hospital. Confira cada campo depois de colar. Não salve.")
    lv := g.Add("ListView", "w640 r" . Min(12, Max(4, chaves.Length + 1)) . " -Multi NoSortHdr", ["#", "Campo", "Prévia do que será colado", "Caracteres"])
    nCola := 0
    for idx, chave in chaves {
        if (chave = "") {
            lv.Add(, idx, "(pular)", "só o Tab", "")
            continue
        }
        v := Valor(dados, chave)
        if (Trim(v) = "") {
            lv.Add(, idx, chave, "(vazio: só o Tab, nada é colado)", "0")
            continue
        }
        nCola += 1
        lv.Add(, idx, chave, Previa(v), StrLen(v))
    }
    lv.ModifyCol(1, 30), lv.ModifyCol(2, 130), lv.ModifyCol(3, 380), lv.ModifyCol(4, 80)
    g.Add("Text", "w640", "1) Confira o paciente acima com o cabeçalho do MV.`n2) No MV, clique dentro do PRIMEIRO campo da tela (esta janela não rouba o foco).`n3) Clique em um dos botões. Nada é salvo e Enter nunca é apertado.")
    bSub := g.Add("Button", "w210", "Confirmar (substituir)")
    bIns := g.Add("Button", "x+8 w180", "Inserir no cursor")
    bNo := g.Add("Button", "x+8 w150 Default", "Cancelar")
    if (paciente = "" || nCola = 0) {
        bSub.Enabled := false
        bIns.Enabled := false
        g.Add("Text", "xm w640 cRed", paciente = "" ? "A resposta veio sem o nome do paciente: peça à IA para incluir 'paciente' e responder de novo." : "A resposta não tem nenhum valor para colar.")
    }
    bSub.OnEvent("Click", (*) => ColaTudo(dados, true))
    bIns.OnEvent("Click", (*) => ColaTudo(dados, false))
    bNo.OnEvent("Click", (*) => Libera())
    g.OnEvent("Close", (*) => Libera())
    g.Show("NoActivate")
}

Previa(v) {
    s := StrReplace(StrReplace(v, "`r", ""), "`n", " ¶ ")
    return StrLen(s) > 90 ? SubStr(s, 1, 90) . "..." : s
}

; ===== colagem =====
ColaTudo(dados, substituir) {
    if E["colando"]
        return
    E["colando"] := true
    try {
        Colagem(dados, substituir)
    } catch as err {
        MsgBox "Erro: " . err.Message . "`n`nConfira o MV antes de continuar.", "CARIMBAR MV", "Iconx 262144"
    }
    E["colando"] := false
    Libera()
}

Colagem(dados, substituir) {
    hwnd := E["hwnd"]
    spec := JANELA . " ahk_id " . hwnd
    if !WinActive(spec) {
        ; só reativa o MV se uma janela do próprio CARIMBAR ficou com o foco E a janela de onde o foco veio era este mesmo MV; senão, não cola
        if (EhJanelaCarimbar(WinExist("A")) && E["ultimaAtiva"] = hwnd) {
            WinActivate "ahk_id " . hwnd
            if !WinWaitActive(spec, , 2) {
                MsgBox "O MV não voltou para a frente. Nada foi colado.`n`nJanela ativa agora: " . DescreveJanela(), "CARIMBAR MV", "Iconx 262144"
                return
            }
            Sleep 300
        } else {
            MsgBox "O MV não está na frente (e não é a mesma janela de onde a foto saiu). Nada foi colado.`n`nJanela ativa agora: " . DescreveJanela() . "`n`nClique no primeiro campo no MV e confirme de novo.", "CARIMBAR MV", "Iconx 262144"
            return
        }
    }
    chaves := TELAS[E["tela"]]
    salvo := ClipboardAll()
    colados := 0
    faltou := []
    falhou := []
    erro := ""
    parou := ""
    ToolTip "CARIMBAR MV: colando... não mexa no teclado nem no mouse."
    try {
        for idx, chave in chaves {
            if !WinActive(spec) {
                parou := "o MV deixou de ser a janela ativa antes do campo " . idx
                break
            }
            if (idx > 1) {
                Send "{Tab}"
                Sleep ATRASO_TAB
            }
            if (chave = "")
                continue
            texto := Valor(dados, chave)
            if (Trim(texto) = "") {
                faltou.Push(chave)
                continue
            }
            if !WinActive(spec) {
                parou := "o MV deixou de ser a janela ativa antes de colar '" . chave . "'"
                break
            }
            A_Clipboard := ""
            A_Clipboard := Normaliza(texto)
            if !ClipWait(2) {
                falhou.Push(chave)
                continue
            }
            if substituir {
                Send "^a"
                Sleep 120
            }
            Send "^v"
            Sleep ATRASO_COLAR
            colados += 1
        }
    } catch as ex {
        erro := ex.Message
    }
    try {
        A_Clipboard := salvo
    } catch as ex2 {
        erro .= (erro = "" ? "" : " | ") . "Não consegui restaurar a área de transferência: " . ex2.Message
    }
    ToolTip
    if (parou != "")
        MsgBox "Colagem INTERROMPIDA: " . parou . ". Campos colados até aqui: " . colados . ".`n`nConfira o MV e não salve.", "CARIMBAR MV", "Iconx 262144"
    else if (erro != "")
        MsgBox "Erro durante a colagem: " . erro . "`n`nConfira o campo no MV antes de continuar.", "CARIMBAR MV", "Iconx 262144"
    else {
        aviso := "CARIMBAR MV: " . colados . " campo(s) colado(s). Confira e salve você mesmo no MV."
        if (faltou.Length > 0)
            aviso .= " Sem valor (só Tab): " . Juntar(faltou, ", ") . "."
        if (falhou.Length > 0)
            aviso .= " Falha ao copiar: " . Juntar(falhou, ", ") . "."
        ToolTip aviso
        SetTimer () => ToolTip(), -6000
    }
}

Libera() {
    SetTimer(Consulta, 0)
    for k in ["gEscolha", "gFotos", "gEspera", "gConf"] {
        if E.Has(k) {
            try E[k].Destroy()
            E.Delete(k)
        }
    }
    E["ocupado"] := false
    E["consultando"] := false
    if E.Has("extId")
        E.Delete("extId")
}

; ===== utilitários =====
Valor(m, k) {
    return m.Has(k) ? m[k] : ""
}

Normaliza(t) {
    t := StrReplace(t, "`r`n", "`n")
    return USAR_CRLF ? StrReplace(t, "`n", "`r`n") : t
}

DescreveJanela() {
    try {
        return WinGetTitle("A") . " (" . WinGetProcessName("A") . ")"
    } catch {
        return "(nenhuma janela ativa)"
    }
}

Juntar(lista, sep := ", ") {
    s := ""
    for item in lista
        s .= (s = "" ? "" : sep) . (item = "" ? "(pular)" : item)
    return s
}

Jstr(s) {
    s := StrReplace(s, "\", "\\")
    s := StrReplace(s, '"', '\"')
    s := StrReplace(s, "`n", "\n")
    s := StrReplace(s, "`r", "\r")
    s := StrReplace(s, "`t", "\t")
    out := ""
    loop parse s {
        c := Ord(A_LoopField)
        out .= (c < 32) ? Format("\u{:04x}", c) : A_LoopField
    }
    return '"' . out . '"'
}

ArrJson(lista) {
    s := ""
    for x in lista
        s .= (s = "" ? "" : ",") . Jstr(x)
    return "[" . s . "]"
}

; ===== leitor de JSON simples (copiado e testado do carimbar-mv-revisado-grok.ahk) =====
; Acréscimo: a lista de linhas da nuvem (LerLinhas) e o modo "bruto", que devolve objetos/listas como texto cru.
LerJson(t) {
    a := InStr(t, "{")
    b := InStr(t, "}", , -1)
    if (!a || b < a)
        throw Error("Não encontrei um bloco entre chaves { } no texto.")
    return ParseJsonFlat(SubStr(t, a, b - a + 1))
}

JsonSkipWs(s, &i) {
    while (i <= StrLen(s) && InStr(" `t`r`n", SubStr(s, i, 1)))
        i++
}

JsonStr(s, &i) {
    out := ""
    i++
    while (i <= StrLen(s)) {
        c := SubStr(s, i, 1)
        if (c = '"') {
            i++
            return out
        }
        if (c = "\") {
            i++
            e := SubStr(s, i, 1)
            if (e = "n")
                out .= "`n"
            else if (e = "r")
                out .= ""
            else if (e = "t")
                out .= "`t"
            else if (e = "b" || e = "f")
                out .= ""
            else if (e = "u") {
                h := SubStr(s, i + 1, 4)
                if !RegExMatch(h, "^[0-9A-Fa-f]{4}$")
                    throw Error("JSON inválido: sequência \u incompleta ou com caractere que não é hexadecimal.")
                out .= Chr(Integer("0x" . h))
                i += 4
            } else
                out .= e
        } else
            out .= c
        i++
    }
    throw Error("JSON com texto sem aspas de fechamento.")
}

JsonSkipNested(s, &i) {
    depth := 0
    st := i
    while (i <= StrLen(s)) {
        c := SubStr(s, i, 1)
        if (c = '"') {
            JsonStr(s, &i)
            continue
        }
        if (c = "{" || c = "[")
            depth++
        else if (c = "}" || c = "]") {
            depth--
            if (depth = 0) {
                i++
                return SubStr(s, st, i - st)
            }
        }
        i++
    }
    throw Error("JSON com estrutura sem fechamento.")
}

ParseJsonFlat(s, bruto := false) {
    m := Map()
    i := 1
    JsonSkipWs(s, &i)
    if (SubStr(s, i, 1) != "{")
        throw Error("O texto não começa com {.")
    i++
    loop {
        JsonSkipWs(s, &i)
        c := SubStr(s, i, 1)
        if (c = "}" || c = "")
            break
        if (c = ",") {
            i++
            continue
        }
        if (c != '"')
            throw Error("JSON inválido perto da posição " . i . ". Confira aspas retas e vírgulas.")
        k := JsonStr(s, &i)
        JsonSkipWs(s, &i)
        if (SubStr(s, i, 1) != ":")
            throw Error("JSON inválido: faltou : depois de " . k . ".")
        i++
        JsonSkipWs(s, &i)
        c := SubStr(s, i, 1)
        if (c = '"')
            m[k] := JsonStr(s, &i)
        else if (c = "{" || c = "[") {
            raw := JsonSkipNested(s, &i)    ; objeto/lista: ignorado (nunca colado), exceto no modo bruto
            if bruto
                m[k] := raw
        } else {
            st := i
            while (i <= StrLen(s) && !InStr(",} `t`r`n", SubStr(s, i, 1)))
                i++
            v := SubStr(s, st, i - st)
            m[k] := (v = "null" ? "" : v)
        }
    }
    return m
}

; resposta de carimbar_buscar: lista [ {id, conteudo:{...}, criado_em}, ... ]; devolve Maps com "conteudo" como texto cru
LerLinhas(t) {
    lista := []
    i := 1
    JsonSkipWs(t, &i)
    if (SubStr(t, i, 1) != "[")
        throw Error("resposta da nuvem em formato inesperado")
    i++
    loop {
        JsonSkipWs(t, &i)
        c := SubStr(t, i, 1)
        if (c = "]" || c = "")
            break
        if (c = ",") {
            i++
            continue
        }
        if (c != "{")
            throw Error("resposta da nuvem em formato inesperado")
        raw := JsonSkipNested(t, &i)
        lista.Push(ParseJsonFlat(raw, true))
    }
    return lista
}
