## Lisons!

**Lisons!** is a desktop eBook reader for language learners. It facilitates learning from reading by providing machine translations ([DeepL](https://www.deepl.com/translator), [Google](https://translate.google.com/)) as well as community-contributed, translated example sentences ([Tatoeba](https://tatoeba.org/)).

Available for Linux, macOS and Windows.

[Go to webiste to download.](http://FIXME)

![](website/resources/screenshot.png)

Note: This is BETA software, and as such is largely untested and may contain bugs.

### Features

* Epub and plain text support.
* Machine translations from DeepL and Google.
* Community-contributed, translated example sentences from Tatoeba.
* Over 100 supported languages.*
* Highly customizable reader interface.

<sub>
* Most of language configurations have not yet been tested and may not work as intended.
</sub>

### Roadmap

...

### Building

1. Clone the repository: ```git clone FIXME```
2. Change to project root directory: ```cd lisons```
3. Install dependencies: ```yarn install```
4. Build: ``yarn build:prod``
5. Create distributable packages for selected platforms: ``yarn dist:<platform>`` (where ```<platform> = linux | macos | windows```)*

<sub>* Might require additional tools. Please consult [electron-builder documentation](https://www.electron.build/).</sub>

### License

See [COPYING.md](COPYING.md) and [LICENSE.md](LICENSE.md).