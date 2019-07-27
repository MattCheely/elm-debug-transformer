import * as _ from 'lodash';
import ElmDebug from './elm-debug.pegjs';
import ElmDebugSimple from './elm-debug-simple.pegjs';

function keyValueLine(key, value, margin) {
    if (!margin) margin = 0;

    return [
        'div',
        { style: `margin-left: ${margin}px` },
        ['span', { style: `color: purple; font-weight: bold` }, key],
        ['span', {}, ' = '],
        value,
    ];
}

function isFinalValue(value) {
    return (
        _.isString(value) ||
        _.isBoolean(value) ||
        value.type === 'Type' ||
        value.type === 'Unit' ||
        value.type === 'Number' ||
        value.type === 'Function'
    );
}

function getFinalValue(value) {
    if (_.isString(value)) return `"${value}"`;
    else if (_.isBoolean(value)) return value ? 'True' : 'False';
    else if (value.type === 'Type') return value.name;
    else if (value.type === 'Unit') return '()';
    else if (value.type === 'Function') return '<function>';
    else if (value.type === 'Internals') return '<internals>';
    else return value.value;
}

function indentValue(level) {
    return 10 * level;
}

function handleHeader(value) {
    if (value.type === undefined || value.value === undefined) {
        if (isFinalValue(value)) return getFinalValue(value);
        else return JSON.stringify(value);
    }

    switch (value.type) {
        case 'ElmDebug':
            const tag = !!value.tag ? value.tag + ': ' : '';
            return tag + handleHeader(value.value);
        case 'Record':
            const keys = _.chain(value.value)
                .mapValues((v, k) => {
                    return k + ' = ' + handleHeader(v);
                })
                .values()
                .value();

            return `{ ${_.truncate(keys.join(', '))} }`;

        case 'Tuple':
            const tupleValues = value.value.map(v => {
                return handleHeader(v);
            });

            return `( ${tupleValues.join(', ')} )`;

        case 'Custom':
            const typeValues = value.value.map(v => {
                return handleHeader(v);
            });
            if (typeValues.length === 0) return value.name;
            else return `${value.name} ${typeValues.join(' ')}`;

        case 'Array':
            return `Array(${value.value.length})`;

        case 'Set':
            return `Set(${value.value.length})`;

        case 'Dict':
            return `Dict(${value.value.length})`;

        case 'List':
            if (value.value.length === 0) return '[]';
            else return `List(${value.value.length})`;

        case 'Number':
            return getFinalValue(value);

        default:
            return toString(value);
    }
}

function listBody(value, level) {
    const listValues = value.map((v, i) => {
        if (isFinalValue(v)) {
            return keyValueLine(i, getFinalValue(v), 34);
        }

        return [
            'div',
            { style: `margin-left:10px` },
            [
                'object',
                {
                    object: v,
                    config: { elmFormat: true, key: i, level: level },
                },
            ],
        ];
    });

    return ['div', {}].concat(listValues);
}

function handleBody(value, config) {
    const level = !config || !config.level ? 1 : config.level + 1;

    if (!value.type || !value.value) {
        return ['div', {}];
    }

    switch (value.type) {
        case 'ElmDebug':
            return ['div', {}, handleBody(value.value, {})];
        case 'Record':
            const values = _.chain(value.value)
                .mapValues((v, k) => {
                    if (isFinalValue(v)) {
                        return keyValueLine(k, getFinalValue(v), 34);
                    }
                    return [
                        'div',
                        { style: `margin-left:10px` },
                        [
                            'object',
                            {
                                object: v,
                                config: {
                                    elmFormat: true,
                                    key: k,
                                    level: level,
                                },
                            },
                        ],
                    ];
                })
                .values()
                .value();

            return ['div', {}].concat(values);

        case 'Array':
        case 'Set':
        case 'Tuple':
            return listBody(value.value, level);

        case 'List':
            if (value.value.length === 0) return null;
            else return listBody(value.value, level);

        case 'Dict':
            const dictValues = value.value.map(item => {
                let key = isFinalValue(item.key)
                    ? getFinalValue(item.key)
                    : handleHeader(item.key);
                if (isFinalValue(item.value)) {
                    return keyValueLine(key, getFinalValue(item.value), 34);
                }

                return [
                    'div',
                    { style: `margin-left:10px` },
                    [
                        'object',
                        {
                            object: item.value,
                            config: { elmFormat: true, key: key, level: level },
                        },
                    ],
                ];
            });
            return ['div', {}].concat(dictValues);

        case 'Custom':
            if (value.value.length === 0) {
                return null;
            }

            return listBody(value.value, level);

        default:
            return ['div', {}, JSON.stringify({ v: value, c: config })];
    }

    return ['div', {}, 'body'];
}

function hasFormatterSupport() {
    const originalFormatters = window.devtoolsFormatters;
    let supported = false;

    window.devtoolsFormatters = [
        {
            header: function(obj, config) {
                supported = true;
                return null;
            },
            hasBody: function(obj) {},
            body: function(obj, config) {},
        },
    ];
    console.log('elm-debug-transformer: checking for formatter support.', {});

    window.devtoolsFormatters = originalFormatters;

    return supported;
}

export function register(opts = { debug: false }) {
    const _log = console.log;
    const simple_mode = !hasFormatterSupport();

    if (!simple_mode) {
        window.devtoolsFormatters = [
            {
                header: function(obj, config) {
                    if (
                        (!!obj.type && obj.type === 'ElmDebug') ||
                        (!!config && config.elmFormat)
                    ) {
                        if (!_.isNil(config) && !_.isNil(config.key)) {
                            return keyValueLine(
                                config.key,
                                handleHeader(obj),
                                10
                            );
                        } else {
                            return ['div', {}, handleHeader(obj)];
                        }
                    } else {
                        return null;
                    }
                },
                hasBody: function(obj) {
                    return true;
                },
                body: function(obj, config) {
                    return ['div', {}, handleBody(obj, config)];
                },
            },
        ];
    }

    console.log = function() {
        if (arguments.length > 1) {
            _log.apply(console, arguments);
            return;
        }
        let msg = arguments[0];

        try {
            const parsed = simple_mode
                ? ElmDebugSimple.parse(msg)
                : ElmDebug.parse(msg);

            if (!!opts.debug) {
                _log.call(console, 'ElmDebugger console:');
            }

            if (_.isArray(msg)) {
                _log.call(console, 'smth', ...msg);
            }

            _log.call(console, JSON.parse(JSON.stringify(parsed)));
        } catch (err) {
            if (!!opts.debug) {
                _log.call(console, `Parsing error: ${err}`);
            }
            _log.call(console, msg);
        }
    };
}
