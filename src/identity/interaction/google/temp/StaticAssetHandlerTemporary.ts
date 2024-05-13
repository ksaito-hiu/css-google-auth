import { StaticAssetHandler } from '@solid/community-server';
import { StaticAssetEntry } from '@solid/community-server';
import { joinFilePath } from '@solid/community-server';

/*
 * 以下のIssueが実装されるまでの繋ぎで無理やり`@cga:`プレフィックスを
 * 使えるようにする。
 * https://github.com/CommunitySolidServer/CommunitySolidServer/issues/1883
 */
export class StaticAssetHandlerTemporary extends StaticAssetHandler {
  public constructor(assets: StaticAssetEntry[], baseUrl: string, options: { expires?: number } = {}) {
    const assets2: StaticAssetEntry[] = [];
    for (const {relativeUrl,filePath} of assets) {
      let filePath2;
      if (filePath.startsWith('@cga:')) {
        filePath2 = joinFilePath(joinFilePath(__dirname,'../../'),filePath.slice('@cga:'.length));
      } else {
        filePath2 = filePath;
      }
      assets2.push(new StaticAssetEntry(relativeUrl,filePath2));
    }
    super(assets2,baseUrl,options);
  }
}
