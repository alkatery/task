<?php

namespace App\Http\Controllers;

use App\Models\Transcription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class TranscriptionController extends Controller
{
    public function index()
    {
        return Transcription::with('creator:id,name')->latest()->get();
    }

    public function show(Transcription $transcription)
    {
        return $transcription;
    }

    public function store(Request $request)
    {
        $audioUrl = null;

        if ($request->hasFile('audio')) {
            $path = $request->file('audio')->store('transcriptions', 'public');
            $audioUrl = "/storage/{$path}";
        } elseif ($request->audio_url) {
            $audioUrl = $request->audio_url;
        }

        $tr = Transcription::create([
            'title' => $request->title ?? 'تفريغ جديد',
            'audio_url' => $audioUrl,
            'task_id' => $request->task_id,
            'created_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json(['id' => $tr->id], 201);
    }

    public function transcribe(Transcription $transcription)
    {
        $apiKey = config('services.groq.api_key');
        if (!$apiKey) {
            return response()->json(['error' => 'مفتاح Groq API غير مُعد'], 400);
        }

        $transcription->update(['status' => 'processing']);

        // الحصول على مسار الملف الفعلي
        $filePath = storage_path('app/public/' . str_replace('/storage/', '', $transcription->audio_url));
        if (!file_exists($filePath)) {
            $transcription->update(['status' => 'failed']);
            return response()->json(['error' => 'ملف صوتي غير موجود'], 404);
        }

        try {
            // Whisper API
            $response = Http::withToken($apiKey)
                ->attach('file', fopen($filePath, 'r'), basename($filePath))
                ->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                    'model' => 'whisper-large-v3',
                    'language' => 'ar',
                    'response_format' => 'verbose_json',
                ]);

            if (!$response->ok()) {
                $transcription->update(['status' => 'failed']);
                return response()->json(['error' => 'فشل التفريغ'], 500);
            }

            $rawText = $response->json('text', '');

            // معالجة LLM للتنسيق الإسلامي
            $formattedText = $this->formatWithLLM($rawText, $apiKey);

            $transcription->update([
                'raw_text' => $rawText,
                'formatted_text' => $formattedText,
                'status' => 'completed',
            ]);

            return response()->json([
                'raw_text' => $rawText,
                'formatted_text' => $formattedText,
            ]);

        } catch (\Exception $e) {
            $transcription->update(['status' => 'failed']);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Transcription $transcription)
    {
        $transcription->update($request->only('formatted_text', 'title'));
        return response()->json(['message' => 'تم الحفظ']);
    }

    private function formatWithLLM(string $text, string $apiKey): string
    {
        try {
            $response = Http::withToken($apiKey)
                ->timeout(60)
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'أنت مُنسّق نصوص إسلامية. قم بتنسيق النص التالي:
1. أضف علامات الترقيم المناسبة
2. قسّم النص إلى فقرات منطقية
3. ضع الآيات القرآنية بين ﴿ ﴾ واكتبها بالرسم العثماني إن أمكن
4. ضع الأحاديث النبوية بين « » مع ذكر الراوي إن ورد
5. أضف "صلى الله عليه وسلم" بعد ذكر النبي
6. أضف "عز وجل" أو "سبحانه وتعالى" بعد لفظ الجلالة
7. حافظ على المعنى الأصلي دون إضافة أو حذف',
                        ],
                        ['role' => 'user', 'content' => $text],
                    ],
                    'temperature' => 0.1,
                    'max_tokens' => 8000,
                ]);

            return $response->json('choices.0.message.content', $text);
        } catch (\Exception $e) {
            return $text;
        }
    }
}
