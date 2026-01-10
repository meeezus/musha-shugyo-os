<?php

namespace App\Http\Middleware;

use App\Models\ApiUsage;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'apiUsage' => fn () => $this->getApiUsageStats($request->user()?->id),
        ];
    }

    private function getApiUsageStats(?int $userId): ?array
    {
        if (!$userId) {
            return null;
        }

        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        $todayUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $today)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        $monthUsage = ApiUsage::where('user_id', $userId)
            ->where('timestamp', '>=', $thisMonth)
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(cost_usd) as cost_usd, COUNT(*) as requests')
            ->first();

        return [
            'today' => [
                'input_tokens' => (int) ($todayUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($todayUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($todayUsage->cost_usd ?? 0),
                'requests' => (int) ($todayUsage->requests ?? 0),
            ],
            'month' => [
                'input_tokens' => (int) ($monthUsage->input_tokens ?? 0),
                'output_tokens' => (int) ($monthUsage->output_tokens ?? 0),
                'cost_usd' => (float) ($monthUsage->cost_usd ?? 0),
                'requests' => (int) ($monthUsage->requests ?? 0),
            ],
        ];
    }
}
