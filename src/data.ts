'use strict';

export var citation_keys = [];
export function set_citation_keys(new_keys) {
    citation_keys = new_keys;
}

export var label_keys = [];
export function set_label_keys(new_keys) {
    label_keys = new_keys;
}

export var main_document;
export function set_main_document(document) {
    main_document = document;
}