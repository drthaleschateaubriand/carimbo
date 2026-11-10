#Requires AutoHotkey v2.0
; Driver do teste de ponta a ponta do CARIMBAR MV nuvem (roda sob Wine). Faz o papel do MÉDICO: abre a janela de teste
; "TesteCarimbar - SoulMV", aperta Ctrl+Alt+M (ou o botão), escolhe a tela, tira as fotos, espera e confirma.
; A IA (quem chama carimbar.responder_mv) é feita de fora, lendo ext.log.
; Uso: AutoHotkey64.exe driver_nuvem.ahk <lista de cenários separada por vírgula> <pausa em ms para o vídeo>
#SingleInstance Off
global NAO_INICIAR := true
#Include ..\carimbar-mv-nuvem.ahk

global DIR := "Z:\workspace\carimbar-mv-nuvem\testes\"
global LISTA := StrSplit(A_Args.Length >= 1 ? A_Args[1] : "evolucao", ",")
global PAUSA := A_Args.Length >= 2 ? Integer(A_Args[2]) : 1500
global CEN := Map(
    "evolucao",      Map("tela","evolucao",      "via","hotkey", "extras",0, "acao","confirmar"),
    "prescricao",    Map("tela","prescricao",    "via","hotkey", "extras",0, "acao","confirmar"),
    "exames",        Map("tela","exames",        "via","hotkey", "extras",0, "acao","inserir"),
    "admissao",      Map("tela","admissao",      "via","hotkey", "extras",0, "acao","confirmar"),
    "alta",          Map("tela","alta",          "via","botao",  "extras",2, "acao","confirmar"),
    "antropometria", Map("tela","antropometria", "via","hotkey", "extras",0, "acao","confirmar"),
    "cancela_conf",  Map("tela","evolucao",      "via","hotkey", "extras",0, "acao","cancelar"),
    "ignora_outras", Map("tela","evolucao",      "via","hotkey", "extras",0, "acao","confirmar"),
    "janela_errada", Map("tela","evolucao",      "via","hotkey", "extras",0, "acao","janela_errada"),
    "sem_paciente",  Map("tela","evolucao",      "via","hotkey", "extras",0, "acao","sem_paciente"),
    "cancela_espera",Map("tela","evolucao",      "via","hotkey", "extras",0, "acao","cancelar_espera"),
    "limite_fotos",  Map("tela","evolucao",      "via","hotkey", "extras",4, "acao","confirmar")
)
global IDX := 0, S := "", mock := "", outra := "", lblParte := ""
global SAIDA := DIR "resultado.jsonl"
global LOGEXT := DIR "ext.log"

Iniciar()                         ; botão CARIMBAR de verdade (janela sem foco)
global CODIGO := NovoCodigo()     ; sessão nova só deste teste
FileAppend "SESSAO " CODIGO "`n", LOGEXT, "UTF-8-RAW"
SetTimer(Doutor, 250)
SetTimer(ProximoCenario, -800)
SetTimer(FimGeral, 1800000)

FimGeral() {
    FileAppend "TIMEOUT_GERAL`n", LOGEXT, "UTF-8-RAW"
    ExitApp
}

ProximoCenario() {
    global IDX, S, mock, outra, lblParte
    IDX += 1
    if (IDX > LISTA.Length) {
        FileAppend "FIM`n", LOGEXT, "UTF-8-RAW"
        Sleep 1500
        ExitApp
    }
    nome := LISTA[IDX]
    c := CEN[nome]
    S := Map("nome", nome, "tela", c["tela"], "via", c["via"], "extras", c["extras"], "acao", c["acao"], "t0", A_TickCount,
        "escolheu", false, "extrasFeitas", 0, "enviou", false, "extLog", false, "conf", false, "clicou", false, "msg", "", "tooltip", "", "fim", false,
        "vistoFotos", 0, "confTexto", "", "habilitado", "", "extId", 0, "fotosSolicitadas", 0, "esperaVista", 0)
    chaves := TELAS[S["tela"]]
    if IsObject(mock)
        try mock.Destroy()
    if IsObject(outra)
        try outra.Destroy()
    mock := Gui(, "TesteCarimbar - SoulMV")
    mock.SetFont("s11")
    mock.Add("Text", "w640 cBlue", "CABEÇALHO DO MV (simulado): Paciente Fictício de Teste   Prontuário 000123")
    lblParte := mock.Add("Text", "w640 cRed", "TESTE: " nome " | tela " S["tela"] " | PARTE 1")
    for i, k in chaves
        mock.Add("Edit", "w640 r2 v" "E" i, "ANTIGO-" i)
    mock.Show("x30 y20")
    outra := Gui(, "Outra janela qualquer")
    outra.Add("Text", , "outra janela (não é o MV)")
    Sleep 600
    A_Clipboard := "SENTINELA-" nome
    WinActivate "TesteCarimbar"
    WinWaitActive "TesteCarimbar", , 3
    ControlFocus "Edit1", "TesteCarimbar"
    if (S["acao"] = "inserir") {
        Send "{Home}{Right 3}"
    }
    Sleep PAUSA
    if (S["via"] = "botao")
        ControlClick "Button1", "ahk_id " BTN.Hwnd
    else
        Send "^!m"
}

Doutor() {
    global S, lblParte
    if (S = "" || S["fim"])
        return
    if (A_TickCount - S["t0"] > 1500000) {
        S["msg"] := "TIMEOUT_CENARIO"
        Termina()
        return
    }
    ; MsgBox do programa (erros/avisos): classe #32770 (a janela de confirmação é outra classe)
    if (mb := WinExist("CARIMBAR MV ahk_class #32770")) {
        S["msg"] := WinGetText(mb)
        Sleep PAUSA * 2
        try ControlClick("Button1", mb)
        return
    }
    ; 1) escolha da tela
    if (w := WinExist("CARIMBAR MV: qual tela?")) && !S["escolheu"] {
        S["escolheu"] := true
        n := 0
        for i, nm in ORDEM
            if (nm = S["tela"])
                n := i
        Sleep PAUSA
        ControlChooseIndex n, "ComboBox1", w
        Sleep PAUSA
        S["dropText"] := WinGetText(w)
        ControlClick "Button1", w
        return
    }
    ; 2) fotos
    if (w := WinExist("CARIMBAR MV: fotos")) && !S["enviou"] {
        if (S["extrasFeitas"] < S["extras"]) {
            Sleep PAUSA
            S["extrasFeitas"] += 1
            lblParte.Value := "TESTE: " S["nome"] " | tela " S["tela"] " | PARTE " (S["extrasFeitas"] + 1) " (tela rolada)"
            Sleep 300
            ControlClick "Button1", w
            Sleep PAUSA
            return
        }
        S["enviou"] := true
        S["textoFotos"] := WinGetText(w)
        S["botaoMaisHabilitado"] := ControlGetEnabled("Button1", w)
        Sleep PAUSA
        ControlClick "Button2", w
        return
    }
    ; 3) esperando a IA
    if WinExist("CARIMBAR MV: aguardando a IA") && E.Has("extId") {
        if !S["extLog"] {
            S["extLog"] := true
            S["extId"] := E["extId"]
            S["esperaTexto"] := WinGetText("CARIMBAR MV: aguardando a IA")
            FileAppend "EXT " S["nome"] " " E["extId"] "`n", LOGEXT, "UTF-8-RAW"
            S["tEspera"] := A_TickCount
        }
        if (S["acao"] = "cancelar_espera" && A_TickCount - S["tEspera"] > 4000) {
            ControlClick "Button1", "CARIMBAR MV: aguardando a IA"
            Sleep 1500
            S["canceladoOcupado"] := E["ocupado"] ? "ocupado" : "livre"
            Termina()
        }
        return
    }
    ; 4) confirmação
    if (w := WinExist("CARIMBAR MV: confirmar")) && !S["conf"] {
        S["conf"] := true
        S["confTexto"] := WinGetText(w)
        S["habilitado"] := ControlGetEnabled("Button1", w) . ControlGetEnabled("Button2", w)
        S["ativaDepoisDeAbrir"] := WinGetTitle("A")
        Sleep PAUSA * 2
        if (S["acao"] = "sem_paciente" || S["acao"] = "cancelar" ) {
            ControlClick "Button3", w
            S["clicou"] := true
            return
        }
        if (S["acao"] = "janela_errada") {
            outra.Show("x700 y300 w400 h150")
            WinActivate "Outra janela qualquer"
            WinWaitActive "Outra janela qualquer", , 3
        } else {
            WinActivate "TesteCarimbar"
            WinWaitActive "TesteCarimbar", , 3
            ControlFocus "Edit1", "TesteCarimbar"
            if (S["acao"] = "inserir")
                Send "{Home}{Right 3}"
        }
        Sleep PAUSA
        S["ativaNoClique"] := WinGetTitle("A")
        ControlClick (S["acao"] = "inserir" ? "Button2" : "Button1"), w
        S["clicou"] := true
        return
    }
    if (S["clicou"]) {
        if (WinExist("ahk_class tooltips_class32") && S["tooltip"] = "")
            S["tooltip"] := WinGetText("ahk_class tooltips_class32")
        if (!E["ocupado"] && !E["colando"]) {
            ; terminou (colagem, cancelamento ou aviso fechado)
            Sleep 600
            if (WinExist("ahk_class tooltips_class32") && S["tooltip"] = "")
                S["tooltip"] := WinGetText("ahk_class tooltips_class32")
            Sleep PAUSA * 2
            Termina()
        }
    }
}

Termina() {
    global S
    if S["fim"]
        return
    S["fim"] := true
    edits := ""
    for i, k in TELAS[S["tela"]]
        edits .= (edits = "" ? "" : ",") . Jstr(mock["E" i].Value)
    j := '{"cenario":' Jstr(S["nome"]) ',"tela":' Jstr(S["tela"]) ',"extId":' S["extId"]
        . ',"edits":[' edits ']'
        . ',"clip":' Jstr(A_Clipboard) ',"tooltip":' Jstr(S["tooltip"]) ',"msgbox":' Jstr(S["msg"])
        . ',"confTexto":' Jstr(S["confTexto"]) ',"habilitado":' Jstr(S["habilitado"])
        . ',"textoFotos":' Jstr(S.Has("textoFotos") ? S["textoFotos"] : "")
        . ',"esperaTexto":' Jstr(S.Has("esperaTexto") ? S["esperaTexto"] : "")
        . ',"ativaNoClique":' Jstr(S.Has("ativaNoClique") ? S["ativaNoClique"] : "")
        . ',"maisHabilitado":' Jstr(S.Has("botaoMaisHabilitado") ? String(S["botaoMaisHabilitado"]) : "")
        . ',"ocupadoDepois":' (E["ocupado"] ? "true" : "false")
        . ',"canceladoOcupado":' Jstr(S.Has("canceladoOcupado") ? S["canceladoOcupado"] : "") '}'
    FileAppend j "`n", SAIDA, "UTF-8-RAW"
    FileAppend "FIM_CENARIO " S["nome"] "`n", LOGEXT, "UTF-8-RAW"
    if E["ocupado"]
        Libera()
    SetTimer(ProximoCenario, -1500)
}
