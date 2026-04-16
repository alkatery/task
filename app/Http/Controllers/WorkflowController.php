<?php

namespace App\Http\Controllers;

use App\Models\Workflow;

class WorkflowController extends Controller
{
    public function index()
    {
        return Workflow::where('is_active', true)->orderBy('id')->get();
    }

    public function show(Workflow $workflow)
    {
        return $workflow;
    }
}
