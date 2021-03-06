'use strict';

import * as path from "path";
import * as vscode from 'vscode';
import * as latex_workshop from './extension';
import * as latex_data from './data';

var fs = require('fs');

export function find_citation_keys() {
    find_main_document();
    var reg = /\\bibliography{(.*?)}/g;
    var text = get_main_document_text();
    var bib;
    var keys = []
    function parse_keys(data) {
        var key, key_reg = /\@\w+\{(.*?),/g;
        while (key = key_reg.exec(data)) {
            key = key[1]
            if (keys.indexOf(key) < 0) {
                keys.push(key);
            }
        }
    }
    while (bib = reg.exec(text)) {
        var file = path.join(path.dirname(latex_data.main_document), path.basename(bib[1], '.bib') + '.bib')
        if (!fs.existsSync(file)) continue;
        var buffer = fs.readFileSync(file);
        parse_keys(buffer);
        latex_data.set_citation_keys(keys);
    }
}

export function find_label_keys() {
    find_main_document();
    var reg = /\\label{(.*?)}/g;
    var text = vscode.window.activeTextEditor.document.getText();
    var keys = [];
    var key;
    // Parse in document labels
    while (key = reg.exec(text)) {
        key = key[1]
        if (keys.indexOf(key) < 0) {
            keys.push(key);
        }
    }
    // Parse aux labels
    let aux_file = path.join(path.dirname(latex_data.main_document), path.basename(latex_data.main_document, '.tex') + '.aux');
    if (fs.existsSync(aux_file)) {
        function parse_keys(data) {
            var key, key_reg = /\\newlabel{(.*?)}/g;
            while (key = key_reg.exec(data)) {
                key = key[1]
                if (keys.indexOf(key) < 0) {
                    keys.push(key);
                }
            }
        }
        var buffer = fs.readFileSync(aux_file);
        parse_keys(buffer);
    }
    latex_data.set_label_keys(keys);
}

export function find_main_document() {
    if (latex_data.main_document != undefined) return;
    if (latex_workshop.configuration.main_document != null) {
        var file = path.join(vscode.workspace.rootPath, latex_workshop.configuration.main_document);
        latex_data.set_main_document(file);
        return;
    }
    var reg = /\\begin{document}/;
    var text = vscode.window.activeTextEditor.document.getText();
    if (reg.exec(text)) {
        latex_data.set_main_document(vscode.window.activeTextEditor.document.uri.fsPath);
        return;
    }
    try {
        var files = fs.readdirSync(vscode.workspace.rootPath);
        for (let file of files) {
            if (path.extname(file) != '.tex') continue;
            file = path.join(vscode.workspace.rootPath, file);
            var buffer = fs.readFileSync(file);
            if (reg.exec(buffer)) {
                latex_data.set_main_document(file);
                return;
            }
        }
    } catch (e) {

    }
    vscode.window.showErrorMessage('No valid main LaTeX document found.');
}

function get_main_document_text() {
    if (latex_data.main_document == undefined) return '';
    return fs.readFileSync(latex_data.main_document);
}
