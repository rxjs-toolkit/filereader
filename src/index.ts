import { Observable } from 'rxjs';

enum TypeReading {
	DataURL = 1,
	BinaryString = 2,
	Text = 3,
	ArrayBuffer = 4,
}

export interface ProgressEventLike<T> {
	readonly lengthComputable: boolean;
	readonly loaded: number;
	readonly total: number;
	readonly completed: boolean;
	readonly result: T;
}

export class RxFileReader {
	public static readAsDataURL<P extends true | false = false>(
		blob: Blob,
		observeProgress?: P,
	) {
		return RxFileReader._readAs<string, P>(
			TypeReading.DataURL,
			blob,
			observeProgress,
		);
	}

	/**
	 * @deprecated
	 *
	 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileReader/readAsBinaryString)
	 */
	public static readAsBinaryString<P extends true | false = false>(
		blob: Blob,
		observeProgress?: P,
	) {
		return RxFileReader._readAs<string, P>(
			TypeReading.BinaryString,
			blob,
			observeProgress,
		);
	}

	public static readAsText<P extends true | false = false>(
		blob: Blob,
		observeProgress?: P,
	) {
		return RxFileReader._readAs<string, P>(
			TypeReading.Text,
			blob,
			observeProgress,
		);
	}

	public static readAsArrayBuffer<P extends true | false = false>(
		blob: Blob,
		observeProgress?: P,
	) {
		return RxFileReader._readAs<ArrayBuffer, P>(
			TypeReading.ArrayBuffer,
			blob,
			observeProgress,
		);
	}

	private static _readAs<T, P extends true | false>(
		typeReading: TypeReading,
		blob: Blob,
		observeProgress?: P,
	): Observable<P extends false ? T : ProgressEventLike<T>> {
		return new Observable<any>((subscriber) => {
			const fileReader = new FileReader();

			const callbackLoad = (e: ProgressEvent<FileReader>) => {
				if (observeProgress) {
					const event: ProgressEventLike<T> = {
						lengthComputable: e.lengthComputable,
						loaded: e.loaded,
						total: e.total,
						completed: true,
						result: e.target.result as any,
					};

					subscriber.next(event);
				} else {
					subscriber.next(e.target.result as any);
				}

				subscriber.complete();
			};

			const callbackError = (e) => {
				subscriber.error(e);
			};

			fileReader.addEventListener('load', callbackLoad, { once: true });
			fileReader.addEventListener('error', callbackError, { once: true });

			if (observeProgress) {
				const callbackProgress = (e: ProgressEvent<FileReader>) => {
					const event: ProgressEventLike<T> = {
						lengthComputable: e.lengthComputable,
						loaded: e.loaded,
						total: e.total,
						completed: e.total === e.loaded,
						result: undefined,
					};

					subscriber.next(event);
				};

				fileReader.addEventListener('start', callbackProgress, { once: true });
				fileReader.addEventListener('progress', callbackProgress);

				subscriber.add(() => {
					fileReader.removeEventListener('start', callbackProgress);
					fileReader.removeEventListener('progress', callbackProgress);
				});
			}

			subscriber.add(() => {
				fileReader.removeEventListener('load', callbackLoad);
				fileReader.removeEventListener('error', callbackError);

				if (fileReader.readyState === FileReader.LOADING) {
					fileReader.abort();
				}
			});

			switch (typeReading) {
				case TypeReading.DataURL:
					fileReader.readAsDataURL(blob);
					break;
				case TypeReading.BinaryString:
					fileReader.readAsBinaryString(blob);
					break;
				case TypeReading.Text:
					fileReader.readAsText(blob);
					break;
				case TypeReading.ArrayBuffer:
					fileReader.readAsArrayBuffer(blob);
					break;
			}
		});
	}
}
