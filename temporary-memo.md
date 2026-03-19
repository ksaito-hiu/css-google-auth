

* <https://github.com/CommunitySolidServer/CommunitySolidServer/blob/v8.0.0-alpha.3/RELEASE_NOTES.md>

`./config/identity/handler/routing/google/temporary.json`の中の"WaterfallHandler"を
"StatusWaterfallHandler"に

JSON-LDの設定ファイル中に名前空間の追加が必要？



以下のエラーは"@id": "urn:solid-server:default:EarlyProcessParallelInitializer"を
使わなくなったら出なくなったけど、前進したのか後退したのか不明。
2026-03-19T11:20:25.308Z [WrappedIndexedStorage] {Primary} error: Type "google" was not defined. The defineType functions needs to be called before accessing data.

---

JSON-LDの設定ファイル中に一部名前空間の追加が必要？と思ったけど・・・

* `./config/identity/handler/storage/google.json`の中の"handlers"を"css:handlers"に
    + 以下を取り除いたら"handlers"で大丈夫になった。

    {
      "comment": "Initialize the google store.",
      "@id": "urn:solid-server:default:EarlyProcessParallelInitializer",
      "@type": "ParallelHandler",
      "css:handlers": [
        { "@id": "urn:cga:core:GoogleStore" }
      ]
    }

* `./config/identity/handler/routing/google/google-oidc.json`の中の"callback_route"を"css:callback_route"に
    + これはGoogleOIDC.tsの引数を変更してたので消せば良いだけだった
* `./config/identity/handler/routing/google/create.json`の中の"handlers"を"css:handlers"に
* `./config/identity/handler/routing/google/google-oidc.json`の中の2箇所の"handlers"を"css:handlers"に
    + 以下の記述をとっぱらった

google-oidc.jsonの中から

    {
      "@id": "urn:solid-server:default:EarlyProcessParallelInitializer",
      "@type": "ParallelHandler",
      "css:handlers": [
        { "@id" : "urn:cga:core:GoogleOIDC" }
      ]
    },

これ必要なかった？！以下を取ってみると`...storage/google.json`の"css:..."が必要なくなる。

* `./config/identity/handler/routing/google/login.json`の中の"handlers"を"css:handlers"に
* `./config/identity/handler/routing/google/resource.json`の中の2箇所の"handlers"を"css:handlers"に
* `./config/identity/handler/routing/google/register.json`の中の"handlers"を"css:handlers"に
* `./config/identity/handler/routing/google/sub.json`の中の"handlers"を"css:handlers"に
* `./config/identity/handler/routing/google/temporary.json`の中の"handlers"を"css:handlers"に

