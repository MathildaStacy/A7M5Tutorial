import Ajv from 'ajv';
import {modelTools} from './protocol';
const ajv = new Ajv({strict: false, allErrors: true});
const validators = new Map(modelTools.map((t) => [t.name, ajv.compile(t.input_schema)]));
export function checkedArgs<T = unknown>(call: {name: string; args: string}): T {
  const args = JSON.parse(call.args);
  const validate = validators.get(call.name);
  if (!validate || !validate(args))
    throw new Error('工具参数无效 ' + ajv.errorsText(validate?.errors));
  return args as T;
}
