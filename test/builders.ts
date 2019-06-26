import * as _ from 'lodash';
import {
    IElmDebugListValue,
    IElmDebugRecordValue,
    IElmDebugValue,
    IFormatter,
} from '../src/CommonTypes';

export function elmDebug(values: any): IElmDebugValue {
    return { type: 'ElmDebug', name: 'Debug', value: values };
}

export function list(
    values: any[],
    typeName: string = 'List'
): IElmDebugListValue {
    return { type: typeName, value: values };
}

export function record(values: { [key: string]: any }): IElmDebugRecordValue {
    return { type: 'Record', value: values };
}

export function n(val: number) {
    return { type: 'Number', value: val };
}

export function customType(name: string, values: any[]) {
    return { type: 'Custom', name, value: values };
}

export function type(name: string) {
    return { type: 'Type', name };
}

export function dict(dictionary: object) {
    return {
        type: 'Dict',
        value: _.toPairs(dictionary).map(item => {
            return { key: item[0], value: item[1] };
        }),
    };
}
export function tuple(values: any[]): IElmDebugListValue {
    return { type: 'Tuple', value: values };
}

export function bool(value: boolean) {
    return { type: 'Boolean', value };
}

export function str(value: string) {
    return { type: 'String', value };
}

export function MLDebug(values: any[]): any[] {
    return ['span', {}, ['span', {}, 'Debug: '], ...values];
}
export function MLString(value: string): any[] {
    return [
        'span',
        { style: 'color: blue; font-weight: normal;' },
        `"${value}"`,
    ];
}

export function MLNumber(num: number): any[] {
    return [
        'span',
        { style: 'color: purple; font-weight: normal;' },
        num.toString(),
    ];
}

export function MLBool(value: boolean): any[] {
    return [
        'span',
        { style: 'color: blue; font-weight: normal;' },
        value ? 'True' : 'False',
    ];
}

export function MLList(typeName: string, length: number): any[] {
    if (length === 0) {
        return ['span', { style: 'color: grey; font-weight: normal;' }, '[]'];
    } else {
        return [
            'span',
            { style: 'color: darkgreen; font-weight: normal;' },
            typeName,
            ['span', {}, `(${length})`],
        ];
    }
}

export function MLCustomType(name: string, value?: any): any[] {
    if (value === undefined) {
        return [
            'span',
            { style: 'color: darkgreen; font-weight: normal;' },
            name,
        ];
    }

    return [
        'span',
        { style: 'color: darkgreen; font-weight: normal;' },
        name + ' ',
        value,
    ];
}

export function MLTuple(values: any[]): any[] {
    // const vals = values.map(v => v);
    const valuesWithCommas = values.reduce((acc: any[], v) => {
        acc.push(['span', {}, ', ']);
        acc.push(v);
        return acc;
    }, []);
    valuesWithCommas.splice(0, 1);
    valuesWithCommas.push(' )');

    return ['span', {}, '( ', ...valuesWithCommas];
}

export function MLEllipsis(): any[] {
    return ['span', { style: 'color: gray; font-weight: normal;' }, '…'];
}

export function MLRecord(values: any[]) {
    const valuesWithCommas = values.reduce((acc, item) => {
        acc.push(['span', {}, ', ']);
        acc.push(item);
        return acc;
    }, []);

    valuesWithCommas.splice(0, 1);

    return ['span', {}, '{ '].concat(valuesWithCommas).concat([' }']);
}

export function MLRecordValue(name: string, value: any): any[] {
    return [
        'span',
        { style: 'color: purple; font-weight: normal;' },
        name + ': ',
        value,
    ];
}
export function MLRecordBodyValue(name: string, value: any): any[] {
    const jsonML = [
        'span',
        { style: 'color: purple; font-weight: normal;margin-left: 13px;' },
        name,
        ': ',
    ];

    const key = {
        attributes: {
            style: 'color: purple; font-weight: normal;margin-left: 13px;',
        },
        jsonML,
    };

    return [
        'div',
        {},
        ['object', { config: { elmFormat: true, key }, object: value }],
    ];
}

export function MLListBodyValue(index: number, value: any): any[] {
    return [
        'div',
        {},
        ['span', { style: 'color: purple; font-weight: normal;' }, index + ''],
        ' = ',
        value,
    ];
}

export function MLBody(children: any[]) {
    return ['div', { style: 'margin-left: 15px;' }, ...children];
}

export function MLObject(child: any, key: any) {
    return ['object', { object: child, config: { elmFormat: true, key } }];
}
