import { render } from 'ejs';
import { EjsTemplateEngine } from '@solid/community-server';
import type { TemplateEngineInput } from '@solid/community-server';
import { getTemplateFilePath, readTemplate } from '@solid/community-server';
import Dict = NodeJS.Dict;
import { Template, TemplateFileName, TemplateString, TemplatePath } from '@solid/community-server';
import { joinFilePath } from '@solid/community-server';

/*
 * 以下のIssueが実装されるまでの繋ぎで無理やり`@cga:`プレフィックスを
 * 使えるEjsTemplateEngineを作って置き換える。
 * https://github.com/CommunitySolidServer/CommunitySolidServer/issues/1883
 */
export class EjsTemplateEngineTemporary<T extends Dict<unknown> = Dict<unknown>> extends EjsTemplateEngine<T> {
  private readonly myBaseUrl: string;

  public constructor(baseUrl: string, supportedExtensions = [ 'ejs' ]) {
    super(baseUrl, supportedExtensions);
    this.myBaseUrl = baseUrl;
  }
  public async handle({ contents, template }: TemplateEngineInput<T>): Promise<string> {
//console.log('GAHA: ***************************************',template);
    if (typeof(template) === 'undefined') {
        // undefined
    } else if (typeof(template) === 'string') {
        // TemplateFileName(string)
        if (template.startsWith('@cga:'))
          template = joinFilePath(joinFilePath(__dirname,'../../../../../'),template.slice(5));
    } else if ('templateString' in template) {
        // TemplateString
    } else  {
        // TemplatePath
        if (template.templateFile.startsWith('@cga:'))
          template.templateFile = joinFilePath(joinFilePath(__dirname,'../../../../../'),template.templateFile.slice(5));
    }
    const options = { ...contents, filename: getTemplateFilePath(template), baseUrl: this.myBaseUrl };
    return render(await readTemplate(template), options);
  }
}
